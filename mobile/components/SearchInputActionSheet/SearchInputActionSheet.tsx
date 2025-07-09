import React, { forwardRef } from "react";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { colors } from "@/constants/theme";
import SearchInput from "@/components/SearchInput/SearchInput";

interface SearchInputActionSheetProps {
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  loadAssistants: (text: string) => void;
}

const SearchInputActionSheet = forwardRef<
  ActionSheetRef,
  SearchInputActionSheetProps
>(
  (
    { searchTerm, setSearchTerm, isFocused, setIsFocused, loadAssistants },
    ref
  ) => {
    return (
      <ActionSheet
        ref={ref}
        gestureEnabled={true}
        indicatorStyle={{
          backgroundColor: colors.grey,
          width: 100,
          marginBottom: 20,
        }}
        containerStyle={{
          backgroundColor: colors.black,
          maxHeight: 300,
          padding: 20,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <SearchInput
          searchterm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search characters..."
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          onSubmitEditing={(text: string) => loadAssistants(text)}
        />
      </ActionSheet>
    );
  }
);

export default SearchInputActionSheet;
