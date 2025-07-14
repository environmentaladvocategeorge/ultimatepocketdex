import { colors } from "@/constants/theme";
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Fontisto from "react-native-vector-icons/Fontisto";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Octicons from "react-native-vector-icons/Octicons";
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons";
import Zocial from "react-native-vector-icons/Zocial";

type IconFamily =
  | "AntDesign"
  | "Entypo"
  | "EvilIcons"
  | "Feather"
  | "FontAwesome"
  | "FontAwesome5"
  | "Fontisto"
  | "Foundation"
  | "Ionicons"
  | "MaterialCommunityIcons"
  | "MaterialIcons"
  | "Octicons"
  | "SimpleLineIcons"
  | "Zocial";

const iconMap: Record<string, React.ElementType> = {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
};

const styles = StyleSheet.create({
  filledButton: {
    width: "100%",
    backgroundColor: "#4d7cc9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  outlinedButton: {
    width: "100%",
    padding: 15,
    borderRadius: 12,
    borderColor: "#4d7cc9",
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  disabledButton: {
    width: "100%",
    backgroundColor: colors.darkGrey,
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  filledText: {
    fontFamily: "InterTight_700Bold",
    fontWeight: "700",
  },
  outlinedText: {
    fontFamily: "InterTight_700Bold",
    fontWeight: "700",
  },
  icon: {
    marginRight: 10,
  },
  outlinedIcon: {
    marginRight: 10,
  },
});

interface ButtonProps {
  title: string;
  icon?: string;
  iconFamily?: IconFamily;
  onPress: () => void;
  type?: "filled" | "outlined";
  backgroundColor?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
}

const Button = ({
  title,
  icon,
  iconFamily = "FontAwesome",
  onPress,
  type = "filled",
  backgroundColor,
  color,
  disabled = false,
  loading = false,
}: ButtonProps) => {
  const IconComponent = iconMap[iconFamily] || iconMap.FontAwesome;

  const buttonStyle =
    disabled || loading
      ? styles.disabledButton
      : type === "filled"
      ? [styles.filledButton, backgroundColor ? { backgroundColor } : {}]
      : [styles.outlinedButton, backgroundColor ? { backgroundColor } : {}];

  const textColor = disabled ? colors.grey : color || colors.white;
  const iconColor = disabled ? colors.grey : color || colors.white;

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      onPress={!disabled && !loading ? onPress : undefined}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && IconComponent && (
            <IconComponent
              name={icon}
              size={20}
              style={[
                type === "filled" ? styles.icon : styles.outlinedIcon,
                { color: iconColor },
              ]}
            />
          )}
          <Text
            style={[
              type === "filled" ? styles.filledText : styles.outlinedText,
              { color: textColor },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
