import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { Text } from "@/components";

const AnimatedText = Animated.createAnimatedComponent(Text);

type Props = {
  value: number;
};

const styles = StyleSheet.create({
  value: {
    color: "#4d7cc9",
    fontSize: 32,
    fontWeight: "700",
  },
});

export default function VaultValue({ value }: Props) {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current !== value) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      previousValue.current = value;
    }
  }, [value]);

  return (
    <AnimatedText
      style={[
        styles.value,
        {
          transform: [{ scale: animatedValue }],
        },
      ]}
    >
      $
      {value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </AnimatedText>
  );
}
