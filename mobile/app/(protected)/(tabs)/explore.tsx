import React, { useEffect, useState, useCallback, useRef, use } from "react";
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
  Card,
  SearchInput,
} from "@/components";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { getGradientColors } from "@/utils/getGradientColors";
import { SortOption, sortOptions } from "@/constants/sortAndFilter";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import CardSetFilterOptionsBottomSheet from "@/components/CardSetFilterOptionsBottomSheet.tsx/CardSetFilterOptionsBottomSheet";
import { Card as CardType, CardSet, Pokemon } from "@/types/api";
import * as ImagePicker from "expo-image-picker";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";

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
});

export default function ExploreScreen() {
  const { getToken } = useAuthentication();
  const { takeImage, isLoading, error } = useDeviceCamera();
  const [cards, setCards] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(sortOptions[0]);
  const [pokemonFilter, setPokemonFilter] = useState<Pokemon | null>(null);
  const [cardSetFilter, setCardSetFilter] = useState<CardSet | null>(null);
  const [q, setQ] = useState<string>("");
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const pokemonFilterSheetRef = useRef<BottomSheetModal>(null);
  const cardSetFilterSheetRef = useRef<BottomSheetModal>(null);
  const flashListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    fetchCards(true);
  }, [sortOption, pokemonFilter, cardSetFilter, q]);

  const fetchCards = useCallback(
    async (reset = false, isRefresh = false) => {
      if (loading || (!hasNext && !reset)) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const token = await getToken();
        const queryParams = new URLSearchParams({
          pageSize: "50",
          page: reset ? "1" : page.toString(),
          sortBy: sortOption.sort,
        });

        if (pokemonFilter?.name) {
          queryParams.append("pokemonName", pokemonFilter.name);
        }
        if (cardSetFilter?.set_name) {
          queryParams.append("setName", cardSetFilter.set_name);
        }
        if (q) {
          queryParams.append("q", q);
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
        setCards((prev) =>
          reset || isRefresh ? newCards : [...prev, ...newCards]
        );
        setHasNext(pagination?.hasNext ?? false);
        setPage(reset || isRefresh ? 2 : page + 1);

        if (reset || isRefresh) {
          flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      getToken,
      page,
      hasNext,
      loading,
      sortOption,
      pokemonFilter,
      cardSetFilter,
      q,
    ]
  );

  const addCardToUser = async (cardId: string, quantity = 1) => {
    try {
      const token = await getToken();

      const response = await fetch(
        `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/user/card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            card_id: cardId,
            quantity: quantity,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add card to user");
      }

      return await response.json();
    } catch (error) {
      console.error("Error in addCardToUser:", error);
      throw error;
    }
  };

  const renderCard = ({ item }: { item: CardType }) => (
    <Card card={item} onAdd={addCardToUser} />
  );

  const onClickCamera = async () => {
    try {
      const formData = await takeImage(true);
      if (formData) {
        const token = await getToken();

        const response = await fetch(
          "https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/search/image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          console.log("Image upload error:", errorData);
          throw new Error(errorData.message || "Failed to upload camera image");
        }

        const data = await response.json();
        console.log("Image upload successful:", data);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
    }
  };

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
      <CardSetFilterOptionsBottomSheet
        ref={cardSetFilterSheetRef}
        selectedCardSet={cardSetFilter}
        onSelect={(option) => {
          cardSetFilterSheetRef.current?.close();
          setCardSetFilter(option);
        }}
      />
      <View style={styles.container}>
        <SearchInput
          value={q}
          onChangeText={setQ}
          placeholder="Search for any card or Pokémon..."
          onClickCamera={onClickCamera}
        />
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
              style={styles.pill}
              activeOpacity={0.7}
              onPress={() => {
                if (cardSetFilter) {
                  setCardSetFilter(null);
                } else {
                  cardSetFilterSheetRef.current?.present();
                }
              }}
            >
              {cardSetFilter ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.pillText}>{cardSetFilter.set_name}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Ionicons
                      name="close-circle-outline"
                      size={12}
                      style={{ marginTop: 0.5 }}
                      color="#fff"
                    />
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.pillText}>{`Filter By Set`}</Text>
                  <View style={{ marginLeft: 6 }}>
                    <Ionicons size={12} name="albums" color="white" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                pokemonFilter
                  ? setPokemonFilter(null)
                  : pokemonFilterSheetRef.current?.present()
              }
            >
              {pokemonFilter ? (
                <LinearGradient
                  colors={getGradientColors(pokemonFilter.types) as any}
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.pillText}>Filter By Pokémon</Text>
                    <View style={{ marginLeft: 6 }}>
                      <Ionicons size={12} name="sparkles" color="white" />
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        <FlashList
          ref={flashListRef}
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item, index) => `${item.card_id}-${index}`}
          estimatedItemSize={250}
          numColumns={2}
          contentContainerStyle={styles.cardGrid}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchCards()}
          onEndReachedThreshold={0.2}
          refreshing={refreshing}
          onRefresh={() => fetchCards(true, true)}
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
