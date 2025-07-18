import { ActivityIndicatorModal } from "@/components";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { User } from "@/types/api";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.black,
  },
});

export default function VaultScreen() {
  const { getToken, isAuthenticated } = useAuthentication();
  const [loading, setLoading] = useState(false);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/user`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      console.log(response);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
    }
  }, [isAuthenticated, getToken]);

  return <View style={styles.container}></View>;
}
