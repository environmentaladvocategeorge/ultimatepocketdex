import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { SearchProvider } from "@/context/SearchContext";

export default function AuthenticatedLayout() {
  return (
    <SearchProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.darkGrey,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            color: colors.white,
            fontFamily: "InterTight_600SemiBold",
            fontSize: 16,
          },
          headerShadowVisible: false,
          headerBackButtonMenuEnabled: false,
          headerBackTitle: "Back",
          headerBackTitleStyle: {
            fontFamily: "InterTight_600SemiBold",
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SearchProvider>
  );
}
