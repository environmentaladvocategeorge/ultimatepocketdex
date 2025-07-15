import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Text from "@/components/Text/Text";
import { colors } from "@/constants/theme";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
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
});

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoComplete?: "email" | "password" | "off";
  secureTextEntry?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: (text: string) => void;
}

const SearchInput = ({
  value,
  onChangeText,
  placeholder,
  autoComplete,
  secureTextEntry,
  onFocus,
  onBlur,
  onSubmitEditing,
}: SearchInputProps) => {
  // Local state to store immediate input value
  const [inputValue, setInputValue] = useState(value);

  // Update local state if parent value changes (important if cleared from outside)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeText(inputValue);
    }, 200);

    // Cleanup if inputValue changes before timeout
    return () => clearTimeout(handler);
  }, [inputValue, onChangeText]);

  const handleClearInput = () => {
    setInputValue("");
    onChangeText("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="search" size={16} color={colors.grey} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.grey}
          value={inputValue}
          onChangeText={setInputValue}
          underlineColorAndroid="transparent"
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          returnKeyType="search"
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={() => {
            if (onSubmitEditing) {
              onSubmitEditing(inputValue);
            }
          }}
        />
        {inputValue.length > 0 && (
          <TouchableOpacity
            onPress={handleClearInput}
            style={styles.clearButton}
          >
            <Icon name="times-circle" size={16} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchInput;
