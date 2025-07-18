import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { Card as CardType } from "@/types/api";
import { Card } from "@/components";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
  cardGrid: {
    paddingHorizontal: 4,
    paddingBottom: 100,
  },
});

export default function VaultScreen() {
  const { getToken, isAuthenticated } = useAuthentication();
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const flashListRef = useRef<FlashList<CardType>>(null);

  const loadUserCards = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/user/card`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error("Failed to fetch user cards:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserCards();
    }
  }, [isAuthenticated, loadUserCards]);

  const renderCard = ({ item }: { item: any }) => <Card card={item.card} />;

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item, index) => `${item.card_id}-${index}`}
        estimatedItemSize={250}
        numColumns={2}
        contentContainerStyle={styles.cardGrid}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#4d7cc9" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
