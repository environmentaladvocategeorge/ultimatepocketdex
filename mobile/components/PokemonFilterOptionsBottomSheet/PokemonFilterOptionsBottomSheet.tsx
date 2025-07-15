import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  SectionListRenderItemInfo,
} from "react-native";
import Text from "../Text/Text";
import SearchInput from "../SearchInput/SearchInput";
import { colors } from "@/constants/theme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { useAuthentication } from "@/context/AuthenticationContext";
import { Pokemon } from "@/types/api";

interface PokemonFilterOptionsBottomSheetProps {
  selectedPokemon: Pokemon | null;
  onSelect: (pokemon: Pokemon) => void;
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.black,
    padding: 16,
    minHeight: 200,
  },
  container: {
    padding: 16,
  },
  regionHeader: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  pokemonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pokemonCard: {
    backgroundColor: colors.darkGrey,
    padding: 6,
    borderRadius: 12,
    width: "24%",
    alignItems: "center",
    justifyContent: "center",
  },
  pokemonSprite: {
    width: 38,
    height: 38,
    marginBottom: 2,
  },
  pokemonName: {
    color: colors.white,
    fontSize: 12,
    textAlign: "center",
  },
  pokemonDexNumber: {
    color: colors.grey,
    fontSize: 10,
    textAlign: "center",
  },
  shimmerSprite: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 2,
  },
  shimmerName: {
    height: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  shimmerDexNumber: {
    height: 10,
    borderRadius: 5,
    width: 30,
  },
  shimmerRegionHeader: {
    borderRadius: 8,
    marginTop: 12,
  },
});

const PokemonFilterOptionsBottomSheet = React.forwardRef<
  BottomSheetModal,
  PokemonFilterOptionsBottomSheetProps
>(({ selectedPokemon, onSelect }, ref) => {
  const { getToken } = useAuthentication();
  const [loading, setLoading] = useState(false);
  const [allSections, setAllSections] = useState<
    { title: string; data: Pokemon[] }[]
  >([]);
  const [sections, setSections] = useState<
    { title: string; data: Pokemon[][] }[]
  >([]);
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

  const groupIntoRows = (pokemons: Pokemon[], rowSize = 4): Pokemon[][] => {
    const rows: Pokemon[][] = [];
    for (let i = 0; i < pokemons.length; i += rowSize) {
      rows.push(pokemons.slice(i, i + rowSize));
    }
    return rows;
  };

  const fetchPokemon = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `https://b3j98olqm3.execute-api.us-east-1.amazonaws.com/dev/pokemon`,
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
      const formattedAllSections = rawSections.map((section: any) => ({
        title: section.region,
        data: section.data,
      }));

      setAllSections(formattedAllSections);

      const formattedSections = formattedAllSections.map((section: any) => ({
        title: section.title,
        data: groupIntoRows(section.data),
      }));

      setSections(formattedSections);
    } catch (error) {
      console.error("Failed to fetch pokemons:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, loading]);

  useEffect(() => {
    fetchPokemon();
  }, []);

  useEffect(() => {
    if (!searchInputValue.trim()) {
      const formattedSections = allSections.map((section) => ({
        title: section.title,
        data: groupIntoRows(section.data),
      }));
      setSections(formattedSections);
      return;
    }

    const lowerInput = searchInputValue.trim().toLowerCase();

    const filteredSections = allSections
      .map((section) => {
        const filteredData = section.data.filter((pokemon) => {
          const nameMatch = pokemon.name.toLowerCase().includes(lowerInput);
          const regionMatch = pokemon.region.toLowerCase().includes(lowerInput);
          const dexMatch = pokemon.national_dex_id
            .toString()
            .includes(lowerInput);
          return nameMatch || regionMatch || dexMatch;
        });
        return {
          title: section.title,
          data: filteredData,
        };
      })
      .filter((section) => section.data.length > 0);

    const groupedFilteredSections = filteredSections.map((section) => ({
      title: section.title,
      data: groupIntoRows(section.data),
    }));

    setSections(groupedFilteredSections);
  }, [searchInputValue, allSections]);

  const renderItem = ({ item }: SectionListRenderItemInfo<Pokemon[]>) => (
    <View style={styles.pokemonRow}>
      {item.map((pokemon) => (
        <TouchableOpacity
          key={pokemon.pokemon_id}
          style={styles.pokemonCard}
          onPress={() => onSelect(pokemon)}
        >
          {pokemon.sprite_url && (
            <Image
              source={{ uri: pokemon.sprite_url }}
              style={styles.pokemonSprite}
              resizeMode="contain"
            />
          )}
          <Text style={styles.pokemonName}>{pokemon.name}</Text>
          <Text style={styles.pokemonDexNumber}>
            #{pokemon.national_dex_id}
          </Text>
        </TouchableOpacity>
      ))}
      {item.length < 4 &&
        Array.from({ length: 4 - item.length }).map((_, i) => (
          <View
            key={`empty-${i}`}
            style={[styles.pokemonCard, { opacity: 0 }]}
          />
        ))}
    </View>
  );

  const renderSectionHeader = ({ section }: any) => (
    <Text style={styles.regionHeader}>{section.title}</Text>
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={["80%"]}
      backgroundStyle={styles.sheetBackground}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.white }}
    >
      <View style={styles.container}>
        <SearchInput
          value={searchInputValue}
          onChangeText={(value) => {
            setSearchInputValue(value);
          }}
          placeholder="Search Pokémon..."
        />
        <BottomSheetSectionList
          sections={sections}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      </View>
    </BottomSheetModal>
  );
});

export default PokemonFilterOptionsBottomSheet;
