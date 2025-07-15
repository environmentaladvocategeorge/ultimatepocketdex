import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Text } from "@/components";
import { colors } from "@/constants/theme";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useAuthentication } from "@/context/AuthenticationContext";

export type Pokemon = {
  pokemon_id: string;
  national_dex_id: number;
  name: string;
  generation: number;
  region: string;
  types: string[];
  sprite_url: string | null;
  provider_id: string;
  provider_name: string;
  create_ts: string | null;
  updated_ts: string | null;
};

interface PokemonFilterOptionsBottomSheetProps {
  selectedPokemon: Pokemon | null;
  onSelect: any;
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.black,
    padding: 16,
    minHeight: 200,
  },
  container: {
    padding: 8,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  regionHeader: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  pokemonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  pokemonCard: {
    backgroundColor: colors.darkGrey,
    padding: 6,
    borderRadius: 12,
    marginBottom: 8,
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
});

const PokemonFilterOptionsBottomSheet = React.forwardRef<
  BottomSheetModal,
  PokemonFilterOptionsBottomSheetProps
>(({ selectedPokemon, onSelect }, ref) => {
  const { getToken } = useAuthentication();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

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

      const formattedSections = await response.json();
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

  const renderRegion = ({
    item,
  }: {
    item: { region: string; data: Pokemon[] };
  }) => (
    <View style={styles.container}>
      <Text style={styles.regionHeader}>{item.region}</Text>
      <View style={styles.pokemonGrid}>
        {item.data.map((pokemon: Pokemon) => (
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
            <Text style={styles.pokemonName}>
              {pokemon.name
                .replace(/-/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Text>
            <Text
              style={styles.pokemonDexNumber}
            >{`#${pokemon.national_dex_id}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["80%"]}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.white }}
    >
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.white} />
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => item.region}
            renderItem={renderRegion}
            contentContainerStyle={{
              paddingBottom: 200,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BottomSheetModal>
  );
});

export default PokemonFilterOptionsBottomSheet;
