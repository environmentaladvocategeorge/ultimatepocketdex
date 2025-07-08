import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input, ClickablePill, Text } from "@/components";
import { signUpUser } from "@/lib/cognito";
import { colors } from "@/constants/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const ageRanges = ["18-24", "25-34", "35-44", "45+"];
  const genders = ["Male", "Female", "Non-Binary"];

  const handleSignUp = async () => {
    try {
      if (!ageRange) {
        alert("Please select an age range.");
        return;
      }
      setLoading(true);

      await signUpUser(username, email, password, ageRange, gender);

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

        <View style={{ marginVertical: 10 }}>
          <Text
            style={{
              fontWeight: "700",
              marginBottom: 8,
              color: colors.white,
            }}
          >
            Age Range
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {ageRanges.map((range) => (
              <ClickablePill
                key={range}
                title={range}
                onPress={() => setAgeRange(range)}
                selected={ageRange === range}
              />
            ))}
          </View>
        </View>

        <View style={{ marginVertical: 10 }}>
          <Text
            style={{
              fontWeight: "700",
              marginBottom: 8,
              color: colors.white,
            }}
          >
            {"Gender (Optional)"}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {genders.map((option) => (
              <ClickablePill
                key={option}
                title={option}
                onPress={() => setGender(gender === option ? "" : option)}
                selected={gender === option}
              />
            ))}
          </View>
        </View>
      </View>

      <Button
        title="Sign Up"
        onPress={handleSignUp}
        disabled={!username || !email || !password || !ageRange}
        loading={loading}
      />
    </View>
  );
}
