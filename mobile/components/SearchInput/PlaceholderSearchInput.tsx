import React from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { colors } from "@/constants/theme";
import Text from "@/components/Text/Text";

interface SearchInputProps {
  placeholder: string;
  onClick: () => void;
}

const PlaceholderSearchInput = ({ placeholder, onClick }: SearchInputProps) => {
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClick}>
        <View style={[styles.inputContainer]}>
          <Icon
            name="search"
            size={16}
            color={colors.grey}
            style={styles.icon}
          />
          <Text style={{ color: colors.grey, padding: 12 }}>{placeholder}</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    flex: 1,
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
});

export default PlaceholderSearchInput;
