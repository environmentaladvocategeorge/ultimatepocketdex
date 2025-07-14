import { useLocalSearchParams } from "expo-router";
import {
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
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
  cardGrid: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  cardItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    margin: 4,
    padding: 8,
    flex: 1,
    maxWidth: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    marginBottom: 6,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  placeholderText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "500",
  },
  cardInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTopInfo: {
    gap: 2,
  },
  cardName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  cardRarity: {
    color: "#3161b0",
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardNumber: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },
  cardPrice: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});

export default function CardSet() {
  const { cardSetId } = useLocalSearchParams();
  const { getToken } = useAuthentication();
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(true);
  const [set, setSet] = React.useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: set?.set_name || "Loading...",
      headerRight: () =>
        set?.set_logo_url ? (
          <Image
            source={{ uri: set.set_logo_url }}
            style={{
              width: 36,
              height: 36,
              marginRight: 10,
              resizeMode: "contain",
            }}
          />
        ) : null,
    });
  }, [navigation, set]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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

        const setData = await response.json();

        if (setData.cards) {
          setData.cards.sort((a, b) => {
            const priceA = parseFloat(a.latest_price?.price ?? 0);
            const priceB = parseFloat(b.latest_price?.price ?? 0);
            return priceB - priceA;
          });
        }

        setSet(setData);
      } catch (error) {
        console.error("Failed to fetch card set data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cardSetId, getToken]);

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.cardItem} activeOpacity={0.7}>
      <View style={styles.cardImageContainer}>
        {item.card_image_url ? (
          <Image
            source={{ uri: item.card_image_url }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardTopInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.card_name}
          </Text>

          {item.card_rarity && (
            <Text style={styles.cardRarity}>{item.card_rarity}</Text>
          )}
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardNumber}>{item.card_number}</Text>
          <Text style={styles.cardPrice}>
            {item.latest_price?.price !== undefined &&
            item.latest_price?.price !== null
              ? `$${Number(item.latest_price.price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$0.00"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getNumColumns = () => {
    // This could be made responsive based on screen width
    return 2;
  };

  if (!loading && (!set || !set.cards || set.cards.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No cards found in this set</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicatorModal visible={loading} />

      {set && set.cards && (
        <FlatList
          data={set.cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.card_id}
          numColumns={getNumColumns()}
          contentContainerStyle={styles.cardGrid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
