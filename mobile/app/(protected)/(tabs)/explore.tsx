import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  SectionList,
} from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import {
  ActivityIndicatorModal,
  PlaceholderSearchInput,
  SearchInputActionSheet,
  Text,
} from "@/components";
import { useSearch } from "@/context/SearchContext";
import { useAuthentication } from "@/context/AuthenticationContext";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 8,
  },
  text: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingRight: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: colors.black,
  },
  toggleButtonInactive: {
    backgroundColor: "transparent",
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleButtonTextActive: {
    color: colors.white,
  },
  toggleButtonTextInactive: {
    color: colors.black,
  },
  card: {
    flex: 1,
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: "hidden",
    maxWidth: (Dimensions.get("window").width - 32) / 2,
  },
  logoContainer: {
    position: "relative",
  },
  logo: {
    width: "100%",
    height: 72,
    resizeMode: "contain",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  overlayTextContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(128,128,128,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardName: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listItemText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  listItemLogo: {
    height: 20,
    aspectRatio: 1.5,
    resizeMode: "contain",
  },
  sectionHeader: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginLeft: 8,
    marginBottom: 4,
  },
});

export default function ExploreScreen() {
  const searchActionSheetRef = useRef<ActionSheetRef>(null);
  const { getToken } = useAuthentication();
  const { addSearchTerm } = useSearch();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cardSets, setCardSets] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const fetchCardSets = async () => {
    try {
      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/card-sets`,
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
      const { sets } = await response.json();
      setCardSets(sets.reverse());
    } catch (error) {
      console.error("Failed to fetch card sets:", error);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await fetchCardSets();
      setLoading(false);
    };
    initLoad();
  }, []);

  const refreshCardSets = async () => {
    setRefreshing(true);
    await fetchCardSets();
    setRefreshing(false);
  };

  const loadSearch = async (term = "") => {
    try {
      searchActionSheetRef.current?.hide();
      setLoading(true);
      const searchTermToUse = term.trim() ? term : searchTerm;
      addSearchTerm(searchTermToUse);
    } catch (error) {
      console.error("Failed to fetch assistants:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = (sets: any[], chunkSize = 1) => {
    const grouped = sets.reduce((acc: any, set: any) => {
      if (!acc[set.series_id]) {
        acc[set.series_id] = {
          title: set.series_name,
          data: [],
        };
      }
      acc[set.series_id].data.push(set);
      return acc;
    }, {});

    if (chunkSize === 1) {
      return Object.values(grouped).map((section: any) => ({
        title: section.title,
        data: section.data,
      }));
    }

    return Object.values(grouped).map((section: any) => ({
      title: section.title,
      data: chunkArray(section.data, chunkSize),
    }));
  };

  const renderListItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.8}
      onPress={() => {}}
    >
      <Image source={{ uri: item.logo_url }} style={styles.listItemLogo} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.listItemText} numberOfLines={1}>
          {item.set_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderToggleButton = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === "grid"
            ? styles.toggleButtonActive
            : styles.toggleButtonInactive,
        ]}
        onPress={() => setViewMode("grid")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="grid-outline"
          size={16}
          color={viewMode === "grid" ? colors.white : colors.black}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === "list"
            ? styles.toggleButtonActive
            : styles.toggleButtonInactive,
        ]}
        onPress={() => setViewMode("list")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="list-outline"
          size={16}
          color={viewMode === "list" ? colors.white : colors.black}
        />
      </TouchableOpacity>
    </View>
  );

  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const getSectionsWithGridRows = (sets: any) => {
    const grouped = sets.reduce((acc: any, set: any) => {
      if (!acc[set.series_id]) {
        acc[set.series_id] = {
          title: set.series_name,
          data: [],
        };
      }
      acc[set.series_id].data.push(set);
      return acc;
    }, {});

    return Object.values(grouped).map((section: any) => ({
      title: section.title,
      data: chunkArray(section.data, 2),
    }));
  };

  const renderGridRow = ({ item }: any) => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {item.map((cardSet: any) => (
          <TouchableOpacity
            key={cardSet.card_set_id}
            style={[
              styles.card,
              { maxWidth: (Dimensions.get("window").width - 32) / 2 },
            ]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <View style={styles.logoContainer}>
              <Image source={{ uri: cardSet.logo_url }} style={styles.logo} />
              <View style={styles.overlayTextContainer}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {cardSet.set_name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {item.length === 1 && (
          <View style={[styles.card, { backgroundColor: "transparent" }]} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ActivityIndicatorModal visible={loading} />
      <SearchInputActionSheet
        ref={searchActionSheetRef}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isFocused={isFocused}
        setIsFocused={setIsFocused}
        loadAssistants={loadSearch}
      />
      <PlaceholderSearchInput
        placeholder="Search sets..."
        onClick={() => {
          searchActionSheetRef.current?.show();
        }}
      />
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }} />
        {renderToggleButton()}
      </View>
      <SectionList
        sections={getSections(cardSets, viewMode === "grid" ? 2 : 1)}
        keyExtractor={(item, index) => {
          if (viewMode === "grid") return item[0].card_set_id;
          return item.card_set_id;
        }}
        renderItem={viewMode === "grid" ? renderGridRow : renderListItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCardSets}
            tintColor={colors.white}
          />
        }
      />
    </View>
  );
}
