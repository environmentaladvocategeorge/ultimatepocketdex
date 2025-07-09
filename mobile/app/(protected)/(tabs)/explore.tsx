import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
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
        setCardSets(sets);
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
        placeholder="Search characters..."
        onClick={() => {
          searchActionSheetRef.current?.show();
        }}
      />
      <View>
        {cardSets.map((set: any) => (
          <Text key={set.id}>{set.name}</Text>
        ))}
      </View>
    </View>
  );
}
