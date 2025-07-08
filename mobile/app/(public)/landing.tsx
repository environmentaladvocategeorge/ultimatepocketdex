import React, { useState, useEffect } from "react";
import { View, Dimensions, Text } from "react-native";
import { Button } from "@/components";
import { Redirect, router } from "expo-router";
import { useAuthentication } from "@/context/AuthenticationContext";
import { colors } from "@/constants/theme";

const { height } = Dimensions.get("window");

export default function LandingScreen() {
  const fullText = "Start chatting now.";
  const [displayText, setDisplayText] = useState("");
  const { isAuthenticated } = useAuthentication();

  useEffect(() => {
    setDisplayText("");

    let i = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) => {
        if (i < fullText.length) {
          const updatedText = prev + fullText[i];
          i++;
          return updatedText;
        } else {
          clearInterval(interval);
          return fullText;
        }
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  if (isAuthenticated) {
    return <Redirect href="/explore" />;
  }

  const renderText = () => {
    const parts = displayText.split(" ");
    return parts.map((part, index) => {
      if (part === "now.") {
        return (
          <Text key={index} style={{ color: "#2c579e" }}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part} </Text>;
    });
  };

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
      >
        <View>
          <Text
            style={{
              fontFamily: "InterTight_500Medium",
              fontSize: 48,
              color: colors.white,
              textAlign: "center",
            }}
          >
            {renderText()}
          </Text>
        </View>
      </View>
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
        {/* <Button
          title="Login"
          onPress={() => router.push("/login")}
          type="filled"
        />
        <Button
          title="Sign Up"
          onPress={() => router.push("/signup")}
          type="outlined"
        /> */}
      </View>
    </View>
  );
}
