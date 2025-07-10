import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ScrollView,
  Animated,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 8,
    marginBottom: 4,
    paddingRight: 8,
  },
  sectionHeaderText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionHeaderButton: {
    padding: 4,
  },
  sectionContent: {
    overflow: "hidden",
  },
  contentContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  contentContainerVisible: {
    position: "relative",
    opacity: 1,
  },
});

const MemoizedListItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.listItem}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <Image source={{ uri: item.set_logo_url }} style={styles.listItemLogo} />
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={styles.listItemText} numberOfLines={1}>
        {item.set_name}
      </Text>
    </View>
  </TouchableOpacity>
));

const MemoizedGridCard = React.memo(({ cardSet, onPress }) => (
  <TouchableOpacity
    style={[
      styles.card,
      { maxWidth: (Dimensions.get("window").width - 32) / 2 },
    ]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.logoContainer}>
      <Image source={{ uri: cardSet.set_logo_url }} style={styles.logo} />
      <View style={styles.overlayTextContainer}>
        <Text style={styles.cardName} numberOfLines={1}>
          {cardSet.set_name}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
));

const MemoizedGridRow = React.memo(({ item, onCardPress }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
    }}
  >
    {item.map((cardSet) => (
      <MemoizedGridCard
        key={cardSet.card_set_id}
        cardSet={cardSet}
        onPress={() => onCardPress(cardSet)}
      />
    ))}
    {item.length === 1 && (
      <View style={[styles.card, { backgroundColor: "transparent" }]} />
    )}
  </View>
));

const GridContent = React.memo(({ data, onCardPress, isVisible }) => (
  <View
    style={[
      styles.contentContainer,
      isVisible && styles.contentContainerVisible,
    ]}
  >
    {data.map((item, index) => (
      <MemoizedGridRow
        key={`grid-${index}`}
        item={item}
        onCardPress={onCardPress}
      />
    ))}
  </View>
));

const ListContent = React.memo(({ data, onCardPress, isVisible }) => (
  <View
    style={[
      styles.contentContainer,
      isVisible && styles.contentContainerVisible,
    ]}
  >
    {data.map((item) => (
      <MemoizedListItem
        key={item.card_set_id}
        item={item}
        onPress={() => onCardPress(item)}
      />
    ))}
  </View>
));

const CollapsibleSection = React.memo(({ section, viewMode, onCardPress }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const animationValue = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;

  const toggleSection = useCallback(() => {
    const toValue = isCollapsed ? 1 : 0;
    const rotationToValue = isCollapsed ? 0 : 1;

    Animated.parallel([
      Animated.timing(animationValue, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotationValue, {
        toValue: rotationToValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, animationValue, rotationValue]);

  const maxHeight = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2000],
  });

  const opacity = animationValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const isGridMode = viewMode === "grid";

  return (
    <View>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleSection}
        activeOpacity={0.7}
      >
        <Text
          style={styles.sectionHeaderText}
        >{`${section.title} (${section.data.length})`}</Text>
        <View style={styles.sectionHeaderButton}>
          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <Ionicons name="chevron-down" size={20} color={colors.white} />
          </Animated.View>
        </View>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight,
            opacity,
          },
        ]}
      >
        <View style={{ position: "relative" }}>
          <GridContent
            data={section.gridData}
            onCardPress={onCardPress}
            isVisible={isGridMode}
          />
          <ListContent
            data={section.listData}
            onCardPress={onCardPress}
            isVisible={!isGridMode}
          />
        </View>
      </Animated.View>
    </View>
  );
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

  const chunkArray = useCallback((arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }, []);

  const processedSections = useMemo(() => {
    return cardSets.map((section) => ({
      ...section,
      gridData: chunkArray(section.data || [], 2),
      listData: section.data || [],
    }));
  }, [cardSets, chunkArray]);

  const fetchCardSets = useCallback(async () => {
    try {
      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/card-set`,
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
      setCardSets(sets);
    } catch (error) {
      console.error("Failed to fetch card sets:", error);
    }
  }, [getToken]);

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await fetchCardSets();
      setLoading(false);
    };
    initLoad();
  }, [fetchCardSets]);

  const refreshCardSets = useCallback(async () => {
    setRefreshing(true);
    await fetchCardSets();
    setRefreshing(false);
  }, [fetchCardSets]);

  const loadSearch = useCallback(
    async (term = "") => {
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
    },
    [searchTerm, addSearchTerm]
  );

  const handleCardPress = useCallback(async (cardSet: any) => {
    const response = await fetch(
      `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/card-set/${cardSet.card_set_id}/card`,
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
    const { cards } = await response.json();
    console.log("Cards for set:", cards);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const renderToggleButton = useCallback(
    () => (
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "grid"
              ? styles.toggleButtonActive
              : styles.toggleButtonInactive,
          ]}
          onPress={() => handleViewModeChange("grid")}
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
          onPress={() => handleViewModeChange("list")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={viewMode === "list" ? colors.white : colors.black}
          />
        </TouchableOpacity>
      </View>
    ),
    [viewMode, handleViewModeChange]
  );

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
        placeholder="Search any card..."
        onClick={() => {
          searchActionSheetRef.current?.show();
        }}
      />
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }} />
        {renderToggleButton()}
      </View>
      <ScrollView
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCardSets}
            tintColor={colors.white}
          />
        }
      >
        {processedSections.map((section) => (
          <CollapsibleSection
            key={section.id}
            section={section}
            viewMode={viewMode}
            onCardPress={handleCardPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}
