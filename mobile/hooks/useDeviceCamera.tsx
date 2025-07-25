import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

type UseDeviceCameraResult = {
  takeImage: () => Promise<string | null>; // Returns Base64
  isLoading: boolean;
  error: string | null;
};

type CompressionOptions = {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: SaveFormat;
};

export function useDeviceCamera(
  compressionOptions: CompressionOptions = {}
): UseDeviceCameraResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    quality = 0.7, // Reduce quality to 70%
    maxWidth = 1920,
    maxHeight = 1080,
    format = SaveFormat.JPEG,
  } = compressionOptions;

  const compressImage = async (uri: string): Promise<string | null> => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        {
          compress: quality,
          format,
          base64: true, // Return Base64
        }
      );
      return manipulatedImage.base64 || null;
    } catch (error) {
      console.warn("Image compression failed:", error);
      return null;
    }
  };

  const takeImage = async (): Promise<string | null> => {
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
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const image = result.assets[0];
      const base64 = await compressImage(image.uri);
      return base64 ? `data:image/jpeg;base64,${base64}` : null;
    } catch (e: any) {
      setError(e?.message || "Unexpected error while taking image");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { takeImage, isLoading, error };
}
