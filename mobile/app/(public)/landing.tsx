import React from "react";
import { View, Dimensions, Text } from "react-native";
import { Button } from "@/components";
import { Redirect, router } from "expo-router";
import { useAuthentication } from "@/context/AuthenticationContext";
import { colors } from "@/constants/theme";

const { height } = Dimensions.get("window");

export default function LandingScreen() {
  const { isAuthenticated } = useAuthentication();

  if (isAuthenticated) {
    return <Redirect href="/sets" />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.black,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      />
      <View
        style={{
          padding: 20,
          height: height * 0.4,
          width: "100%",
          backgroundColor: colors.darkGrey,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          title="Continue with Apple"
          icon="apple"
          onPress={() => {}}
          type="filled"
          backgroundColor={colors.white}
          color="black"
        />
        <Button
          title="Continue with Google"
          icon="google"
          onPress={() => {}}
          type="outlined"
        />
        <Button
          title="Login"
          onPress={() => router.push("/login")}
          type="filled"
        />
        <Button
          title="Sign Up"
          onPress={() => router.push("/signup")}
          type="outlined"
        />
      </View>
    </View>
  );
}
