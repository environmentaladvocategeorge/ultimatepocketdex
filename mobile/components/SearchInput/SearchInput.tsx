import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Animated,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Text from "@/components/Text/Text";
import { colors } from "@/constants/theme";
import { useSearch } from "@/context/SearchContext";
import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    backgroundColor: colors.darkGrey,
  },
  icon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontFamily: "InterTight_400Regular",
    padding: 12,
    paddingHorizontal: 12,
  },
  clearButton: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  divider: {
    height: 2,
    backgroundColor: "#ececec",
    borderRadius: 5,
    marginVertical: 10,
  },
  recentSearchesContainer: {
    marginTop: 16,
    marginBottom: 8,
    maxHeight: 300,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentSearchesTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  clearAllText: {
    color: colors.white,
    fontSize: 14,
  },
  searchItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchItemText: {
    color: colors.white,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 8,
  },
  cancelButton: {
    marginLeft: 8,
  },
});

interface SearchInputProps {
  searchterm: string;
  setSearchTerm: (text: string) => void;
  placeholder: string;
  autoComplete?: "email" | "password" | "off";
  secureTextEntry?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
  onSubmitEditing?: (text: string) => void;
}

const SearchInput = ({
  searchterm,
  setSearchTerm,
  placeholder,
  autoComplete,
  secureTextEntry,
  onFocus,
  onBlur,
  isFocused,
  setIsFocused,
  onSubmitEditing,
}: SearchInputProps) => {
  const cancelButtonSize = useRef(new Animated.Value(0)).current;
  const { recentSearches, clearSearches } = useSearch();

  useEffect(() => {
    Animated.timing(cancelButtonSize, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleClearInput = () => {
    setSearchTerm("");
  };

  const handleCancel = () => {
    setSearchTerm("");
    setIsFocused(false);
    if (onBlur) onBlur();
    Keyboard.dismiss();

    if (onSubmitEditing) {
      onSubmitEditing("");
    }
  };

  const handleSearchItemPress = (term: string) => {
    setSearchTerm(term);
    if (onSubmitEditing) {
      onSubmitEditing(term);
    }
  };

  const cancelButtonStyle = {
    transform: [
      {
        scale: cancelButtonSize.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
  };

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Icon
            name="search"
            size={16}
            color={isFocused ? colors.white : colors.grey}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.grey}
            value={searchterm}
            onChangeText={setSearchTerm}
            underlineColorAndroid="transparent"
            autoComplete={autoComplete}
            secureTextEntry={secureTextEntry}
            returnKeyType="search"
            autoFocus
            onFocus={() => {
              setIsFocused(true);
              if (onFocus) onFocus();
            }}
            onSubmitEditing={() => {
              if (onSubmitEditing) {
                onSubmitEditing(searchterm);
              }
            }}
          />
          {searchterm.length > 0 && (
            <TouchableOpacity
              onPress={handleClearInput}
              style={styles.clearButton}
            >
              <Icon name="times-circle" size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {isFocused && (
          <Animated.View style={[cancelButtonStyle, styles.cancelButton]}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ color: colors.white }}>CANCEL</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearSearches}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView>
            {recentSearches.map((search) => (
              <TouchableOpacity
                key={search.id}
                onPress={() => handleSearchItemPress(search.term)}
                style={styles.searchItemContainer}
              >
                <Text style={styles.searchItemText}>{search.term}</Text>
                <Ionicons
                  name="refresh-sharp"
                  size={16}
                  style={{ color: colors.white }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SearchInput;
