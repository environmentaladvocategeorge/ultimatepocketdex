import { colors } from "@/constants/theme";
import React from "react";
import Text from "@/components/Text/Text";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface ClickablePillProps {
  title: string;
  icon?: string;
  onPress?: () => void;
  type?: "filled" | "outlined";
  selected?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

const ClickablePill = ({
  title,
  icon,
  onPress,
  type = "filled",
  selected = false,
  style,
  disabled = false,
}: ClickablePillProps) => {
  const borderColor = selected ? colors.white : colors.grey;
  const textColor = selected ? colors.white : colors.grey;

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: type === "filled" ? colors.darkGrey : "transparent",
          borderColor:
            type === "filled" && !selected ? "transparent" : borderColor,
          borderWidth: type === "filled" && !selected ? 0 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      {icon && (
        <Icon name={icon} size={20} style={styles.icon} color={textColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    height: 40,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  text: {
    fontFamily: "InterTight_700Bold",
    fontWeight: "700",
  },
  icon: {
    marginLeft: 4,
  },
});

export default ClickablePill;
