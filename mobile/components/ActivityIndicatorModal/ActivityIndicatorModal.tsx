import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { colors } from "@/constants/theme";

const ActivityIndicatorModal = ({ visible }: { visible: boolean }) => {
  const [showText, setShowText] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visible) {
      setShowText(false);
      fadeAnim.setValue(0);
      timer = setTimeout(() => {
        setShowText(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }, 10000);
    }

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.white} />
          {showText && (
            <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
              This may take a second...
            </Animated.Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 100,
  },
  text: {
    color: colors.white,
    marginTop: 10,
    fontSize: 16,
  },
});

export default ActivityIndicatorModal;
