import { Slot, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import {
  AuthenticationProvider,
  useAuthentication,
} from "@/context/AuthenticationContext";
import {
  InterTight_100Thin,
  InterTight_200ExtraLight,
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_400Regular_Italic,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  InterTight_900Black,
} from "@expo-google-fonts/inter-tight";

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const [fontsLoaded] = useFonts({
    InterTight_100Thin,
    InterTight_200ExtraLight,
    InterTight_300Light,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_400Regular_Italic,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    InterTight_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    <Slot />;
  }

  const { isAuthenticated } = useAuthentication();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup =
      segments[0] === "(protected)" && segments[1] === "(tabs)";

    if (isAuthenticated && !inTabsGroup) {
      router.replace("/explore");
    } else if (!isAuthenticated) {
      router.replace("/landing");
    }
  }, [isAuthenticated]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthenticationProvider>
      <InitialLayout />
    </AuthenticationProvider>
  );
}
