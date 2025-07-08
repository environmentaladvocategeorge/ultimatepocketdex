import { colors } from "@/constants/theme";
import { ActivityIndicator, View } from "react-native";

const Index = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" color={colors.grey} />
    </View>
  );
};

export default Index;
