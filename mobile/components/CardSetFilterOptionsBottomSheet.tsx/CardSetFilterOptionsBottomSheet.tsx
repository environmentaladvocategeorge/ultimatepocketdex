import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from "react-native";
import Text from "../Text/Text";
import SearchInput from "../SearchInput/SearchInput";
import { colors } from "@/constants/theme";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useAuthentication } from "@/context/AuthenticationContext";
import { CardSet } from "@/types/api"; // Ensure this type exists

interface CardSetFilterOptionsBottomSheetProps {
  selectedCardSet: CardSet | null;
  onSelect: (cardSet: CardSet) => void;
}

type FlashListItem =
  | { type: "header"; title: string }
  | { type: "row"; title: string; data: CardSet[] };

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.black,
    padding: 16,
    minHeight: 200,
  },
  container: {
    padding: 16,
  },
  seriesHeader: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardSetCard: {
    backgroundColor: colors.darkGrey,
    padding: 8,
    borderRadius: 12,
    width: "48%",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardSetLogo: {
    width: 38,
    height: 38,
    marginBottom: 2,
  },
  cardSetName: {
    color: colors.white,
    fontSize: 12,
    textAlign: "center",
  },
});

const CardSetFilterOptionsBottomSheet = React.forwardRef<
  BottomSheetModal,
  CardSetFilterOptionsBottomSheetProps
>(({ selectedCardSet, onSelect }, ref) => {
  const { getToken } = useAuthentication();
  const [loading, setLoading] = useState(false);
  const [allSections, setAllSections] = useState<
    { title: string; data: CardSet[] }[]
  >([]);
  const [items, setItems] = useState<FlashListItem[]>([]);
  const [searchInputValue, setSearchInputValue] = useState("");

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        enableTouchThrough={false}
      />
    ),
    []
  );

  const groupIntoRows = (cardSets: CardSet[], rowSize = 2): CardSet[][] => {
    const rows: CardSet[][] = [];
    for (let i = 0; i < cardSets.length; i += rowSize) {
      rows.push(cardSets.slice(i, i + rowSize));
    }
    return rows;
  };

  const flattenSections = (
    sections: { title: string; data: CardSet[] }[]
  ): FlashListItem[] => {
    return sections.flatMap((section) => [
      { type: "header" as const, title: section.title },
      ...groupIntoRows(section.data).map((row) => ({
        type: "row" as const,
        title: section.title,
        data: row,
      })),
    ]);
  };

  const fetchCardSets = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/card-set`,
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

      const rawSections = await response.json();
      const formatted = rawSections.map((section: any) => ({
        title: section.series,
        data: section.data,
      }));

      setAllSections(formatted);
      setItems(flattenSections(formatted));
    } catch (error) {
      console.error("Failed to fetch card sets:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, loading]);

  useEffect(() => {
    fetchCardSets();
  }, []);

  useEffect(() => {
    if (!searchInputValue.trim()) {
      setItems(flattenSections(allSections));
      return;
    }

    const lowerInput = searchInputValue.trim().toLowerCase();
    const filtered = allSections
      .map((section) => {
        const filteredData = section.data.filter((cardSet) => {
          const nameMatch = cardSet.set_name.toLowerCase().includes(lowerInput);
          const seriesMatch = cardSet.series_name
            .toLowerCase()
            .includes(lowerInput);
          const providerMatch = cardSet.provider_name
            .toLowerCase()
            .includes(lowerInput);
          return nameMatch || seriesMatch || providerMatch;
        });
        return {
          title: section.title,
          data: filteredData,
        };
      })
      .filter((section) => section.data.length > 0);

    setItems(flattenSections(filtered));
  }, [searchInputValue, allSections]);

  const renderItem = ({ item }: { item: FlashListItem }) => {
    if (item.type === "header") {
      return <Text style={styles.seriesHeader}>{item.title}</Text>;
    }

    return (
      <View style={styles.cardRow}>
        {item.data.map((cardSet) => (
          <TouchableOpacity
            key={cardSet.card_set_id}
            style={styles.cardSetCard}
            onPress={() => onSelect(cardSet)}
          >
            {cardSet.set_logo_url && (
              <Image
                source={{ uri: cardSet.set_logo_url }}
                style={styles.cardSetLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.cardSetName}>{cardSet.set_name}</Text>
          </TouchableOpacity>
        ))}
        {item.data.length < 4 &&
          Array.from({ length: 4 - item.data.length }).map((_, i) => (
            <View
              key={`empty-${i}`}
              style={[styles.cardSetCard, { opacity: 0 }]}
            />
          ))}
      </View>
    );
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={["80%"]}
      backgroundStyle={styles.sheetBackground}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.white }}
    >
      <View style={[styles.container, { flex: 1 }]}>
        <SearchInput
          value={searchInputValue}
          onChangeText={setSearchInputValue}
          placeholder="Search Card Sets..."
        />
        <View style={{ flex: 1 }}>
          <FlashList
            data={items}
            estimatedItemSize={48}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
});

export default CardSetFilterOptionsBottomSheet;
