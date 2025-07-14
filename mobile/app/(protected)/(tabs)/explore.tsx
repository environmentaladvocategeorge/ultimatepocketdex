import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";

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
  cardItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    margin: 4,
    padding: 8,
    flex: 1,
    maxWidth: "48%",
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
  cardSet: {
    color: colors.white,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardRarity: {
    color: "#4d7cc9",
    fontSize: 8,
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
});

export default function ExploreScreen() {
  const { getToken } = useAuthentication();
  const [cards, setCards] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    if (loading || !hasNext) return;

    try {
      setLoading(true);
      const token = await getToken();
      console.log(
        `Fetching: https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/search?pageSize=50&page=${page}`
      );
      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/search?pageSize=50&page=${page}`,
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

      const { cards: newCards, pagination } = await response.json();
      setCards((prev) => [...prev, ...newCards]);
      setHasNext(pagination?.hasNext ?? false);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, hasNext, loading]);

  useEffect(() => {
    fetchCards();
  }, []);

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
            <Text style={styles.cardSet}>{`${item.card_set_name}`}</Text>
          )}

          {item.card_rarity && (
            <Text style={styles.cardRarity}>{`${item.card_rarity}`}</Text>
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

  return (
    <View style={styles.container}>
      {cards && (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.card_id}
          numColumns={2}
          contentContainerStyle={styles.cardGrid}
          showsVerticalScrollIndicator={false}
          onEndReached={fetchCards}
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#4d7cc9" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
