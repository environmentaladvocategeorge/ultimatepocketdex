import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { signUpUser } from "@/lib/cognito";
import { colors } from "@/constants/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setLoading(true);

      await signUpUser(username, email, password);

      router.push({
        pathname: "/confirmation",
        params: { username, password, email },
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          label="Username"
          placeholder="Enter your username"
          value={username}
          setValue={setUsername}
        />
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
        title="Sign Up"
        onPress={handleSignUp}
        disabled={!username || !email || !password}
        loading={loading}
      />
    </View>
  );
}
