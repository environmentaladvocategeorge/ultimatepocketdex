import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
});

export default function SetsScreen() {
  const { getToken } = useAuthentication();
  return <View style={styles.container}></View>;
}
