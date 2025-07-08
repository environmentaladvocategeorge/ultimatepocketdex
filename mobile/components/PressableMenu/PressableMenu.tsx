import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Dimensions,
  LayoutChangeEvent,
  ActivityIndicator,
  Alert,
} from "react-native";
import Text from "@/components/Text/Text";
import { colors } from "@/constants/theme";

import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Zocial from "@expo/vector-icons/Zocial";

type IconFamily =
  | "AntDesign"
  | "Entypo"
  | "EvilIcons"
  | "Feather"
  | "FontAwesome"
  | "FontAwesome5"
  | "Fontisto"
  | "Foundation"
  | "Ionicons"
  | "MaterialCommunityIcons"
  | "MaterialIcons"
  | "Octicons"
  | "SimpleLineIcons"
  | "Zocial";

const iconMap: Record<IconFamily, React.ComponentType<any>> = {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    color: colors.white,
    marginLeft: 12,
    fontSize: 16,
  },
  menuItemTextDisabled: {
    color: colors.grey,
  },
});

export interface MenuItemProps {
  icon: string;
  iconFamily?: IconFamily;
  label: string;
  onPress: () => Promise<void> | void;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  id?: string;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  confirmationButtonText?: string;
}

interface PressableMenuProps {
  children?: React.ReactNode;
  menuItems: MenuItemProps[];
  menuStyle?: StyleProp<ViewStyle>;
  xOffset?: number;
  yOffset?: number;
  containerStyle?: StyleProp<ViewStyle>;
  defaultIconFamily?: IconFamily;
  defaultIconSize?: number;
  defaultIconColor?: string;
  padding?: number;
  disabled?: boolean;
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const PressableMenu = ({
  menuItems,
  menuStyle,
  xOffset = -100,
  yOffset = -120,
  containerStyle,
  defaultIconFamily = "Ionicons",
  defaultIconSize = 20,
  defaultIconColor = colors.white,
  padding = 16,
  isVisible,
  onClose,
  position,
}: PressableMenuProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const [menuDimensions, setMenuDimensions] = useState({ width: 0, height: 0 });
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const itemsWithIds = menuItems.map((item, index) => ({
    ...item,
    id: item.id || `menu-item-${index}`,
  }));

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setLoadingItems({});
      });
    }
  }, [isVisible, fadeAnim]);

  const onMenuLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMenuDimensions({ width, height });
  };

  const calculatePosition = () => {
    if (menuDimensions.width === 0 || menuDimensions.height === 0) {
      return {
        left: position.x + xOffset,
        top: position.y + yOffset,
      };
    }

    let left = position.x + xOffset;
    let top = position.y + yOffset;

    if (left < padding) {
      left = padding;
    } else if (left + menuDimensions.width + padding > screenWidth) {
      left = screenWidth - menuDimensions.width - padding;
    }

    if (top < padding) {
      top = padding;
    } else if (top + menuDimensions.height + padding > screenHeight) {
      top = screenHeight - menuDimensions.height - padding;
    }

    return { left, top };
  };

  const executeItemAction = async (item: MenuItemProps & { id: string }) => {
    try {
      setLoadingItems((prev) => ({ ...prev, [item.id]: true }));
      await item.onPress();
      setLoadingItems((prev) => ({ ...prev, [item.id]: false }));
      onClose();
    } catch (error) {
      console.error("Error in menu item action:", error);
      setLoadingItems((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const showConfirmationAlert = (item: MenuItemProps & { id: string }) => {
    const title = item.confirmationTitle || "Confirm Action";
    const message =
      item.confirmationMessage ||
      `Are you sure you want to ${item.label.toLowerCase()}?`;
    const confirmText = item.confirmationButtonText || item.label;

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: confirmText,
          style: "destructive",
          onPress: () => executeItemAction(item),
        },
      ],
      { cancelable: true }
    );
  };

  const handleMenuItemPress = (item: MenuItemProps & { id: string }) => {
    if (item.requiresConfirmation) {
      showConfirmationAlert(item);
    } else {
      executeItemAction(item);
    }
  };

  const renderIcon = (item: MenuItemProps & { id: string }) => {
    const isLoading = loadingItems[item.id];

    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={item.iconColor || defaultIconColor}
          style={{
            width: item.iconSize || defaultIconSize,
            height: item.iconSize || defaultIconSize,
          }}
        />
      );
    }

    const IconComponent = iconMap[item.iconFamily || defaultIconFamily];
    const iconSize = item.iconSize || defaultIconSize;
    const iconColor = item.iconColor || defaultIconColor;

    return <IconComponent name={item.icon} size={iconSize} color={iconColor} />;
  };

  const MenuItem = (item: MenuItemProps & { id: string }) => {
    const isLoading = loadingItems[item.id];
    const isDisabled = item.disabled || isLoading;

    return (
      <TouchableOpacity
        style={[styles.menuItem, isDisabled && styles.menuItemDisabled]}
        onPress={() => !isDisabled && handleMenuItemPress(item)}
        disabled={isDisabled}
      >
        {renderIcon(item)}
        <Text
          style={[
            styles.menuItemText,
            isDisabled && styles.menuItemTextDisabled,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const menuPosition = calculatePosition();

  return (
    <View style={containerStyle}>
      <Modal
        transparent
        visible={isVisible}
        animationType="none"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={onClose}
          activeOpacity={1}
        >
          <Animated.View
            onLayout={onMenuLayout}
            style={[
              styles.menuContainer,
              menuStyle,
              {
                left: menuPosition.left,
                top: menuPosition.top,
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {itemsWithIds.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PressableMenu;
