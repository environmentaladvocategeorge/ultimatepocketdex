import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  cameraButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
    backgroundColor: "#4d7cc9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
  onClickCamera?: () => Promise<void>; // assuming it's async
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
  onClickCamera,
}: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeText(inputValue);
    }, 200);

    return () => clearTimeout(handler);
  }, [inputValue, onChangeText]);

  const handleClearInput = () => {
    setInputValue("");
    onChangeText("");
  };

  const handleCameraClick = async () => {
    if (!onClickCamera) return;

    try {
      setIsCameraLoading(true);
      await onClickCamera();
    } catch (e) {
      console.warn("Camera error:", e);
    } finally {
      setIsCameraLoading(false);
    }
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
      {onClickCamera && (
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCameraClick}
          disabled={isCameraLoading}
        >
          {isCameraLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="camera-outline" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchInput;
