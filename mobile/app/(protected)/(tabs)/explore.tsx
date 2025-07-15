import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Text, SearchSortOptionsBottomSheet } from "@/components";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

type SortOption = {
  name: string;
  icon: React.ReactNode;
  sort: "price_asc" | "price_desc" | "name_asc" | "name_desc";
};

const sortOptions = [
  {
    name: "Price Ascending",
    icon: <FontAwesome5 name="sort-amount-up" size={12} color={colors.white} />,
    sort: "price_asc",
  },
  {
    name: "Price Descending",
    icon: (
      <FontAwesome5 name="sort-amount-up-alt" size={12} color={colors.white} />
    ),
    sort: "price_desc",
  },
  {
    name: "A-Z",
    icon: <FontAwesome5 name="sort-alpha-up" size={12} color={colors.white} />,
    sort: "name_asc",
  },
  {
    name: "Z-A",
    icon: (
      <FontAwesome5 name="sort-alpha-up-alt" size={12} color={colors.white} />
    ),
    sort: "name_desc",
  },
];

const CardImage = ({
  uri,
  style,
  placeholderStyle,
  placeholderTextStyle,
}: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!uri || hasError) {
    return (
      <View style={placeholderStyle}>
        <Text style={placeholderTextStyle}>No Image</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode="contain"
      />
      {isLoading && (
        <View style={[StyleSheet.absoluteFillObject, styles.imageLoader]}>
          <ActivityIndicator size="small" color="#4d7cc9" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
  scrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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

  const sortSheetRef = useRef<BottomSheetModal>(null);

  const openSortSheet = () => {
    sortSheetRef.current?.present();
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    sortSheetRef.current?.dismiss();
  };

  const fetchCards = useCallback(async () => {
    if (loading || !hasNext) return;

    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/search?pageSize=50&page=${page}&sortBy=${sortOption.sort}`,
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
  }, [getToken, page, hasNext, loading, sortOption]);

  useEffect(() => {
    fetchCards();
  }, []);

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.cardItem} activeOpacity={0.7}>
      <View style={styles.cardImageContainer}>
        <CardImage
          uri={item.card_image_url}
          style={styles.cardImage}
          placeholderStyle={styles.placeholderImage}
          placeholderTextStyle={styles.placeholderText}
        />
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
    <>
      <SearchSortOptionsBottomSheet
        ref={sortSheetRef}
        sortOptions={sortOptions}
        selectedOption={sortOption}
        onSelect={handleSortSelect}
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
              onPress={() => {
                openSortSheet();
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={styles.pillText}
                >{`Sort By ${sortOption.name}`}</Text>
                <View style={{ marginLeft: 6 }}>{sortOption.icon}</View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {cards && (
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.card_id}
            numColumns={2}
            contentContainerStyle={styles.cardGrid}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchCards}
            onEndReachedThreshold={0.2}
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
    </>
  );
}
