import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Text from "../Text/Text";
import { Image as ExpoImage } from "expo-image";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Card as CardType } from "@/types/api";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#333",
    margin: 4,
    flex: 1,
  },
  cardImageContainer: {
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    marginBottom: 6,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
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
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 14,
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
    marginTop: 12,
  },
  addButtonInline: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4d7cc9",
    borderRadius: 11,
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
  userCardQuantity: {
    color: colors.grey,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "right",
  },
});

interface CardProps {
  card: CardType;
  quantity?: number;
  onAdd?: (cardId: string) => Promise<void>;
  height?: number;
}

const Card = ({ card, onAdd, quantity, height = 120 }: CardProps) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleAdd = async () => {
    if (!onAdd || status === "loading") return;
    try {
      setStatus("loading");
      await onAdd(card.card_id);
      setStatus("success");
    } catch (error) {
      console.error("Error adding card:", error);
      setStatus("error");
    } finally {
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    }
  };

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ transform: [{ scale: 0.6 }] }}
          />
        );
      case "success":
        return <Ionicons name="checkmark" size={15} color="#5cb85c" />;
      case "error":
        return <Ionicons name="close" size={18} color="#ff4d4d" />;
      default:
        return <Ionicons name="add" size={18} color="#fff" />;
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.cardImageContainer, { height }]}>
        <ExpoImage
          source={card.card_image_url}
          style={styles.cardImage}
          contentFit="contain"
          recyclingKey={card.card_id}
          transition={100}
        />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTopInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {card.card_name}
          </Text>
          {card.card_rarity && (
            <Text style={styles.cardSet}>{card.card_set_name}</Text>
          )}
          {card.card_rarity && (
            <Text style={styles.cardRarity}>{card.card_rarity}</Text>
          )}
        </View>
        <View style={styles.cardBottomRow}>
          {onAdd && (
            <TouchableOpacity
              style={styles.addButtonInline}
              onPress={handleAdd}
              disabled={status !== "idle"}
            >
              {renderIcon()}
            </TouchableOpacity>
          )}
          <Text style={styles.cardNumber}>{card.card_number}</Text>
          <Text style={styles.cardPrice}>
            {card.latest_price?.price !== undefined &&
            card.latest_price?.price !== null
              ? `$${Number(card.latest_price.price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$0.00"}
          </Text>
        </View>
        {quantity !== undefined && (
          <Text style={styles.userCardQuantity}>Quantity: {quantity}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Card;
