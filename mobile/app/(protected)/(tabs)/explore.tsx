import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  Text,
  SearchSortOptionsBottomSheet,
  PokemonFilterOptionsBottomSheet,
} from "@/components";
import { Image as ExpoImage } from "expo-image";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { getGradientColors } from "@/utils/getGradientColors";
import { SortOption, sortOptions } from "@/constants/sortAndFilter";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
  pillContainer: {
    height: 26,
    marginBottom: 8,
  },
  pillScroll: {
    paddingHorizontal: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#4d7cc9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pillText: {
    color: colors.white,
    fontWeight: "400",
    fontSize: 10,
  },
  cardGrid: {
    paddingHorizontal: 4,
    paddingBottom: 100,
  },
  cardItem: {
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
  imageLoader: {
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
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
  const [sortOption, setSortOption] = useState<SortOption>(sortOptions[0]);
  const [pokemonFilter, setPokemonFilter] = useState<any>(null);
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const pokemonFilterSheetRef = useRef<BottomSheetModal>(null);
  const flashListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    fetchCards(true);
  }, [sortOption, pokemonFilter]);

  const fetchCards = useCallback(
    async (reset = false) => {
      if (loading || (!hasNext && !reset)) return;
      try {
        setLoading(true);
        const token = await getToken();
        const queryParams = new URLSearchParams({
          pageSize: "50",
          page: reset ? "1" : page.toString(),
          sortBy: sortOption.sort,
        });
        if (pokemonFilter?.name) {
          queryParams.append("pokemonName", pokemonFilter.name);
        }
        const response = await fetch(
          `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/search?${queryParams.toString()}`,
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
        setCards((prev) => (reset ? newCards : [...prev, ...newCards]));
        setHasNext(pagination?.hasNext ?? false);
        setPage((prev) => (reset ? 2 : prev + 1));
        if (reset)
          flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        setLoading(false);
      }
    },
    [getToken, page, hasNext, loading, sortOption, pokemonFilter]
  );

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.cardItem} activeOpacity={0.7}>
      <View style={styles.cardImageContainer}>
        <ExpoImage
          source={{ uri: item.card_image_url }}
          style={styles.cardImage}
          contentFit="contain"
          recyclingKey={item.card_id}
          transition={100}
        />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTopInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.card_name}
          </Text>
          {item.card_rarity && (
            <Text style={styles.cardSet}>{item.card_set_name}</Text>
          )}
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

  return (
    <>
      <SearchSortOptionsBottomSheet
        ref={sortSheetRef}
        sortOptions={sortOptions}
        selectedOption={sortOption}
        onSelect={(option: any) => {
          sortSheetRef.current?.close();
          setSortOption(option);
        }}
      />
      <PokemonFilterOptionsBottomSheet
        ref={pokemonFilterSheetRef}
        selectedPokemon={pokemonFilter}
        onSelect={(option) => {
          pokemonFilterSheetRef.current?.close();
          setPokemonFilter(option);
        }}
      />
      <View style={styles.container}>
        <View style={styles.pillContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillScroll}
          >
            <TouchableOpacity
              style={styles.pill}
              activeOpacity={0.7}
              onPress={() => sortSheetRef.current?.present()}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={styles.pillText}
                >{`Sort By ${sortOption.name}`}</Text>
                <View style={{ marginLeft: 6 }}>{sortOption.icon}</View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                pokemonFilter
                  ? setPokemonFilter(null)
                  : pokemonFilterSheetRef.current?.present()
              }
              style={{ marginRight: 12 }}
            >
              {pokemonFilter ? (
                <LinearGradient
                  colors={getGradientColors(pokemonFilter.types)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.pill, { borderWidth: 0, paddingRight: 8 }]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={[styles.pillText, { marginRight: 6 }]}>
                      {pokemonFilter.name}
                    </Text>
                    <Ionicons
                      name="close-circle-outline"
                      size={12}
                      style={{ marginTop: 1 }}
                      color="#fff"
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Filter By Pokemon</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        <FlashList
          ref={flashListRef}
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.card_id}
          estimatedItemSize={250}
          numColumns={2}
          contentContainerStyle={styles.cardGrid}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchCards()}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#4d7cc9" />
              </View>
            ) : null
          }
        />
      </View>
    </>
  );
}
