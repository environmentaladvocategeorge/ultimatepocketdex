import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuthentication } from "@/context/AuthenticationContext";
import { colors } from "@/constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 20,
  },
  label: {
    color: colors.grey,
    fontSize: 14,
    marginTop: 12,
  },
  value: {
    color: colors.white,
    fontSize: 18,
    marginTop: 4,
  },
  errorText: {
    color: "red",
    marginTop: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const USER_PROFILE_ENDPOINT =
  "https://oj65068c91.execute-api.us-east-1.amazonaws.com/dev/user-profile";

export default function UserProfileScreen() {
  const { getToken, isAuthenticated } = useAuthentication();
  const [user, setUser] = useState<{
    user_id: string;
    user_name: string;
    email_address: string;
    gender?: string;
    age_range: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const response = await fetch(USER_PROFILE_ENDPOINT, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Error fetching user profile: ${response.statusText}`
          );
        }

        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [getToken, isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.value}>No user data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>User ID:</Text>
      <Text style={styles.value}>{user.user_id}</Text>

      <Text style={styles.label}>Name:</Text>
      <Text style={styles.value}>{user.user_name}</Text>

      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{user.email_address}</Text>

      <Text style={styles.label}>Gender:</Text>
      <Text style={styles.value}>{user.gender ?? "Not specified"}</Text>

      <Text style={styles.label}>Age Range:</Text>
      <Text style={styles.value}>{user.age_range}</Text>
    </ScrollView>
  );
}
