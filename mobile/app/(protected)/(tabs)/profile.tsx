import { ActivityIndicatorModal } from "@/components";
import { colors } from "@/constants/theme";
import { useAuthentication } from "@/context/AuthenticationContext";
import { User } from "@/types/api";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.black,
  },
  header: {
    width: "100%",
    height: 120,
    backgroundColor: "#2c579e",
  },
  avatarContainer: {
    position: "absolute",
    top: 120 - 40,
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: colors.grey,
  },
  userInfoContainer: {
    alignItems: "center",
    marginTop: 45,
  },
  username: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  handle: {
    color: colors.grey,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 40,
  },
  statColumn: {
    alignItems: "center",
    marginHorizontal: 20,
  },
  statNumber: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  statLabel: {
    color: colors.grey,
    fontSize: 14,
  },
  joinDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  joinDateText: {
    color: colors.grey,
    marginLeft: 5,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGrey,
    paddingVertical: 10,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 16,
    color: colors.grey,
  },
  activeTabText: {
    fontWeight: "bold",
    color: colors.white,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#2c579e",
    borderRadius: 2,
  },
  scene: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 20,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 70,
  },
  placeholderText: {
    color: colors.grey,
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default function ProfileScreen() {
  const { getToken, isAuthenticated } = useAuthentication();

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://sckyk8xgrg.execute-api.us-east-1.amazonaws.com/dev/user-profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const userProfileData: User = {
        userId: data.user_id,
        userName: data.user_name,
        emailAddress: data.email_address,
        gender: data.gender,
        ageRange: data.age_range,
        createTs: data.create_ts,
        updatedTs: data.updated_ts,
      };

      setUserProfile(userProfileData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
    }
  }, [isAuthenticated, getToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicatorModal visible={loading} />
      <View style={styles.header} />
      <View style={styles.avatarContainer}>
        <View style={styles.avatar} />
      </View>

      <View style={styles.userInfoContainer}>
        <Text style={styles.username}>{userProfile?.userName}</Text>
      </View>
      <View style={styles.joinDateContainer}>
        <Text style={styles.joinDateText}>Since Jan. 24</Text>
      </View>
    </View>
  );
}
