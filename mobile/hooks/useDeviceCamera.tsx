import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

type UseDeviceCameraResult = {
  takeImage: (compress?: boolean) => Promise<FormData | null>;
  isLoading: boolean;
  error: string | null;
};

export function useDeviceCamera(): UseDeviceCameraResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = async (uri: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (e) {
      throw new Error("Failed to compress image");
    }
  };

  const takeImage = async (compress = true): Promise<FormData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        setError("Camera permission not granted");
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const image = result.assets[0];
      const uri = compress ? await compressImage(image.uri) : image.uri;

      const filename = uri.split("/").pop() || "upload.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";

      const formData = new FormData();
      formData.append("image", {
        uri,
        name: filename,
        type,
      } as any);

      return formData;
    } catch (e: any) {
      setError(e?.message || "Unexpected error while taking image");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { takeImage, isLoading, error };
}
