import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
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
  card: {
    flex: 1,
    margin: 8,
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
});

export default function ExploreScreen() {
  const searchActionSheetRef = useRef<ActionSheetRef>(null);
  const { getToken } = useAuthentication();
  const { addSearchTerm } = useSearch();

  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cardSets, setCardSets] = useState([]);

  useEffect(() => {
    const fetchCardSets = async () => {
      setLoading(true);
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
        console.error("Failed to fetch card sets on load:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCardSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const renderCardSetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        /* maybe open set details? */
      }}
    >
      <View style={styles.logoContainer}>
        <Image source={{ uri: item.logo_url }} style={styles.logo} />
        <View style={styles.overlayTextContainer}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.set_name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
        placeholder="Search sets..."
        onClick={() => {
          searchActionSheetRef.current?.show();
        }}
      />
      <FlatList
        data={cardSets}
        keyExtractor={(item) => item.card_set_id}
        renderItem={renderCardSetItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
