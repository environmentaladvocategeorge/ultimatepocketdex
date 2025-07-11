import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import React, { useEffect, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { ActivityIndicatorModal } from "@/components";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
});

export default function CardSet() {
  const { cardSetId } = useLocalSearchParams();
  const { getToken } = useAuthentication();
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(true);
  const [cards, setCards] = React.useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: cardSetId,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/card-set/${cardSetId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const { cards } = await response.json();
      setCards(cards);
    };
    fetchData().catch((error) => {
      console.error("Failed to fetch card set data:", error);
    });
  }, [cardSetId]);
  return (
    <View style={styles.container}>
      <ActivityIndicatorModal visible={loading} />
    </View>
  );
}
