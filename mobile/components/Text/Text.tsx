import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
  StyleProp,
} from "react-native";

interface TextProps extends RNTextProps {
  fontFamily?: string;
}

const getFontFamily = (fontWeight: TextStyle["fontWeight"]) => {
  switch (fontWeight) {
    case "100":
      return "InterTight_100Thin";
    case "200":
      return "InterTight_200ExtraLight";
    case "300":
      return "InterTight_300Light";
    case "400":
      return "InterTight_400Regular";
    case "500":
      return "InterTight_500Medium";
    case "600":
      return "InterTight_600SemiBold";
    case "700":
      return "InterTight_700Bold";
    case "800":
      return "InterTight_800ExtraBold";
    case "900":
      return "InterTight_900Black";
    default:
      return "InterTight_400Regular";
  }
};

const Text = ({
  style,
  fontFamily = "InterTight_400Regular",
  ...props
}: TextProps) => {
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle;
  const fontWeight = flattenedStyle?.fontWeight;
  const resolvedFontFamily = getFontFamily(fontWeight) || fontFamily;

  return (
    <RNText
      style={[styles.text, { fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: "InterTight_400Regular",
  },
});

export default Text;
