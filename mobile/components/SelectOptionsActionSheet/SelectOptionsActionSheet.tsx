import { colors } from "@/constants/theme";
import React, { forwardRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import ClickablePill from "@/components/ClickablePill/ClickablePill";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCROLL_VIEW_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: colors.grey,
    width: 100,
    marginBottom: 20,
  },
  container: {
    minHeight: 300,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    color: colors.white,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    padding: 8,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsContainerMultiple: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  pillWrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  doneButtonContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: colors.grey,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 12,
    marginTop: 8,
  },
  categoryOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

interface Option {
  id: string;
  value: string;
  category?: string;
}

interface SelectOptionsActionSheetProps {
  title: string;
  options: Option[];
  selectedOption: Option[] | Option;
  onSelect: any;
  onClose: () => void;
  deselectable?: boolean;
  multiple?: boolean;
  limit?: number;
}

const SelectOptionsActionSheet = forwardRef<
  ActionSheetRef,
  SelectOptionsActionSheetProps
>(
  (
    {
      title,
      options,
      selectedOption,
      onSelect,
      onClose,
      deselectable = false,
      multiple = false,
      limit,
    },
    ref
  ) => {
    const selected = Array.isArray(selectedOption)
      ? selectedOption
      : selectedOption
      ? [selectedOption]
      : [];

    const [selectionCount, setSelectionCount] = useState<number>(
      selected.length
    );

    useEffect(() => {
      setSelectionCount(selected.length);
    }, [selected]);

    const isLimitReached = limit !== undefined && selectionCount >= limit;

    const handleSelect = (option: Option) => {
      if (multiple) {
        const newSelection = [...selected];
        const optionIndex = newSelection.findIndex(
          (item) => item.id === option.id
        );

        if (optionIndex >= 0) {
          newSelection.splice(optionIndex, 1);
          onSelect(newSelection);
        } else if (!isLimitReached) {
          newSelection.push(option);
          onSelect(newSelection);
        }
      } else {
        if (
          deselectable &&
          selectedOption &&
          (selectedOption as Option).id === option.id
        ) {
          onSelect(null);
        } else {
          onSelect(option);
          onClose();
        }
      }
    };

    const renderTitle = () => {
      if (limit !== undefined) {
        return (
          <Text style={styles.title}>
            {title} (
            <Text
              style={{
                color: selectionCount >= limit ? colors.error : colors.white,
              }}
            >
              {selectionCount}/{limit}
            </Text>
            )
          </Text>
        );
      }
      return <Text style={styles.title}>{title}</Text>;
    };

    const groupedOptions = options.reduce<Record<string, Option[]>>(
      (acc, option) => {
        const category = option.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(option);
        return acc;
      },
      {}
    );

    const categories = Object.keys(groupedOptions).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });

    const renderOptions = () => {
      const hasCategories = options.some((option) => option.category);

      if (!hasCategories) {
        return (
          <View
            style={[
              styles.optionsContainer,
              multiple && styles.optionsContainerMultiple,
            ]}
          >
            {options.map((option) => {
              const isSelected = selected.some((item) => item.id === option.id);
              const isDisabled = !isSelected && isLimitReached;

              return (
                <View
                  key={option.id}
                  style={multiple ? styles.pillWrapper : null}
                >
                  <ClickablePill
                    title={option.value}
                    onPress={() => handleSelect(option)}
                    selected={isSelected}
                    type={multiple ? "filled" : "outlined"}
                    disabled={isDisabled}
                  />
                </View>
              );
            })}
          </View>
        );
      }

      return categories.map((category) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={[multiple && styles.categoryOptionsContainer]}>
            {groupedOptions[category].map((option) => {
              const isSelected = selected.some((item) => item.id === option.id);
              const isDisabled = !isSelected && isLimitReached;

              return (
                <View
                  key={option.id}
                  style={multiple ? styles.pillWrapper : null}
                >
                  <ClickablePill
                    title={option.value}
                    onPress={() => handleSelect(option)}
                    selected={isSelected}
                    type={multiple ? "filled" : "outlined"}
                    disabled={isDisabled}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ));
    };

    return (
      <ActionSheet
        ref={ref}
        gestureEnabled={true}
        indicatorStyle={styles.indicator}
        containerStyle={{
          ...styles.container,
          backgroundColor: multiple ? colors.black : colors.darkGrey,
        }}
      >
        <View style={styles.header}>
          {renderTitle()}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          style={[styles.scrollView, { maxHeight: SCROLL_VIEW_MAX_HEIGHT }]}
          keyboardShouldPersistTaps="handled"
        >
          {renderOptions()}
        </KeyboardAwareScrollView>
      </ActionSheet>
    );
  }
);

export default SelectOptionsActionSheet;
