import { Tabs } from "expo-router";
import { useAuthentication } from "@/context/AuthenticationContext";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuthentication();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.darkGrey,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          color: colors.white,
          fontFamily: "InterTight_700Bold",
          textTransform: "uppercase",
          fontSize: 24,
        },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: "absolute",
          height: 72,
          backgroundColor: colors.darkGrey,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.grey,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search-sharp" : "search-outline"}
              size={24}
              color={color}
              style={{ height: 24, width: 24 }}
            />
          ),
        }}
        redirect={!isAuthenticated}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "",
          headerShown: false,
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-outline" : "person"}
              size={24}
              color={color}
              style={{ height: 24, width: 24 }}
            />
          ),
        }}
        redirect={!isAuthenticated}
      />
    </Tabs>
  );
}
