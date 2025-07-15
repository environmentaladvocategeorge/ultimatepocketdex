import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components";
import { colors } from "@/constants/theme";
import { FontAwesome5 } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

type SortOption = {
  name: string;
  icon: React.ReactNode;
};

interface SearchSortOptionsBottomSheetProps {
  sortOptions: SortOption[];
  selectedOption: SortOption;
  onSelect: any;
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.black,
    padding: 16,
    minHeight: 200,
  },
  container: {
    padding: 16,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: "column",
    gap: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedOptionItem: {
    backgroundColor: "#4d7cc9",
    borderColor: "#4d7cc9",
  },
  optionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.white,
    fontWeight: "600",
  },
});

const SearchSortOptionsBottomSheet = React.forwardRef<
  BottomSheetModal,
  SearchSortOptionsBottomSheetProps
>(({ sortOptions, selectedOption, onSelect }, ref) => {
  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        enableTouchThrough={false}
      />
    ),
    []
  );
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["40%"]}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.white }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Sort Options</Text>

        <View style={styles.optionsContainer}>
          {sortOptions.map((option, index) => {
            const isSelected = option.name === selectedOption.name;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  isSelected && styles.selectedOptionItem,
                ]}
                onPress={() => onSelect(option)}
                activeOpacity={0.7}
              >
                {option.icon}
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                  ]}
                >
                  {option.name}
                </Text>
                {isSelected && (
                  <FontAwesome5 name="check" size={16} color={colors.white} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BottomSheetModal>
  );
});

export default SearchSortOptionsBottomSheet;
