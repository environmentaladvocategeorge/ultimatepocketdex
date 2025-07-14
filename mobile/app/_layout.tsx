import { Slot, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback, useState } from "react";
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

  const { isAuthenticated } = useAuthentication();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      setIsNavigationReady(true);
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inTabsGroup =
      segments[0] === "(protected)" && segments[1] === "(tabs)";

    if (isAuthenticated && !inTabsGroup) {
      router.replace("/sets");
    } else if (!isAuthenticated) {
      router.replace("/landing");
    }
  }, [isAuthenticated, isNavigationReady]);

  if (!fontsLoaded) {
    return null;
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthenticationProvider>
      <InitialLayout />
    </AuthenticationProvider>
  );
}
