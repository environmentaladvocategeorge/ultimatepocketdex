import React, { useState } from "react";
import { useAuthentication } from "@/context/AuthenticationContext";
import { View } from "react-native";
import { Button, Input, KeyboardAvoidingWrapper } from "@/components";
import { signInUser } from "@/lib/cognito";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const { setUser, setIsAuthenticated } = useAuthentication();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const session = await signInUser(email, password);
      setUser(session);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingWrapper>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.black,
          padding: 20,
        }}
      >
        <View style={{ width: "100%" }}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            setValue={setEmail}
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            autoComplete="password"
            secureTextEntry
          />
        </View>
        <Button
          title="Sign In"
          onPress={handleSignIn}
          disabled={!email || !password}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingWrapper>
  );
}
