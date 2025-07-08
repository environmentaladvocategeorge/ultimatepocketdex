import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Text } from "@/components";
import { colors } from "@/constants/theme";
import { confirmUserSignUp } from "@/lib/cognito";
import { useAuthentication } from "@/context/AuthenticationContext";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";

const CELL_COUNT = 6;

export default function ConfirmationScreen() {
  const { setIsAuthenticated, setUser } = useAuthentication();
  const params = useLocalSearchParams();
  const username = params.username as string;
  const email = params.email as string;
  const password = params.password as string;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  const handleConfirmation = async () => {
    if (code.length !== CELL_COUNT) {
      setError("Please enter the complete verification code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const session = await confirmUserSignUp(username, password, code);

      setUser(session);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Verify your account</Text>

        <Text style={styles.description}>
          We've sent a verification code to {email}. Please enter the 6-digit
          code below.
        </Text>

        <CodeField
          ref={ref}
          {...props}
          value={code}
          onChangeText={setCode}
          cellCount={CELL_COUNT}
          rootStyle={styles.codeFieldRoot}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          renderCell={({ index, symbol, isFocused }) => (
            <View
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}
              onLayout={getCellOnLayoutHandler(index)}
            >
              <Text style={styles.cellText}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            </View>
          )}
        />

        <Button
          title="Verify Account"
          onPress={handleConfirmation}
          disabled={code.length !== CELL_COUNT}
          loading={loading}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 20,
    justifyContent: "center",
  },
  contentContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 32,
    textAlign: "center",
  },
  codeFieldRoot: {
    marginBottom: 32,
  },
  cell: {
    width: 40,
    height: 50,
    lineHeight: 38,
    fontSize: 24,
    borderWidth: 1,
    borderColor: colors.darkGrey,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  focusCell: {
    borderColor: colors.grey,
  },
  cellText: {
    fontSize: 24,
    color: colors.white,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
});
