import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { UserCard } from "@/types/api";
import { Card, Text } from "@/components";
import { useFocusEffect } from "@react-navigation/native";
import VaultValue from "@/components/VaultValue/VaultValue";

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
  const [cards, setCards] = useState<UserCard[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flashListRef = useRef<FlashList<UserCard>>(null);

  const loadUserCards = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
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

        const {
          user_cards: userCards,
          total_user_card_value: totalUserCardValue,
          total_user_card_count: totalUserCardCount,
        } = await response.json();

        setCards(userCards);
        setTotalValue(totalUserCardValue);
        setTotalCount(totalUserCardCount);
      } catch (error) {
        console.error("Failed to fetch user cards:", error);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [getToken]
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadUserCards();
      }
    }, [isAuthenticated, loadUserCards])
  );

  const renderCard = ({ item }: { item: UserCard }) => {
    if (!item.card) return null;
    return <Card card={item.card} quantity={item.quantity} />;
  };

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
        refreshing={refreshing}
        onRefresh={() => loadUserCards(true)}
        ListHeaderComponent={
          <View style={{ padding: 8, alignItems: "center" }}>
            <Text
              style={{ color: colors.grey }}
            >{`Vault Total (${totalCount} cards)`}</Text>
            <VaultValue value={totalValue} />
          </View>
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#4d7cc9" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
