import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  View,
} from "react-native";

const KeyboardAvoidingWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View
        style={styles.inner}
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={() => false}
        onResponderRelease={() => Keyboard.dismiss()}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  inner: {
    flexGrow: 1,
  },
});

export default KeyboardAvoidingWrapper;
