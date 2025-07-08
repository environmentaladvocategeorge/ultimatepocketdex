import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.black,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          color: colors.white,
          fontFamily: "InterTight_600SemiBold",
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackButtonMenuEnabled: false,
        headerBackTitle: "Back",
        headerBackTitleStyle: {
          fontFamily: "InterTight_600SemiBold",
        },
      }}
    >
      <Stack.Screen
        name="landing"
        options={{
          headerShown: false,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="login"
        options={{
          headerTitle: "LOGIN",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="signup"
        options={{
          headerTitle: "SIGN UP",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="confirmation"
        options={{
          headerTitle: "CONFIRMATION",
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default AuthLayout;
