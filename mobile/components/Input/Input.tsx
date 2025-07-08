import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  DimensionValue,
  KeyboardType,
} from "react-native";
import Text from "@/components/Text/Text";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { RadioButton } from "react-native-radio-buttons-group";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    color: colors.white,
  },
  description: {
    color: colors.grey,
    fontSize: 14,
    marginBottom: 16,
  },
  required: {
    color: colors.error,
    fontSize: 18,
  },
  largeLabel: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    color: colors.white,
    fontFamily: "InterTight_400Regular",
  },
  regularInput: {
    padding: 16,
    paddingHorizontal: 24,
  },
  compactInput: {
    padding: 12,
    paddingHorizontal: 16,
  },
  transparentInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  multilineInput: {
    textAlignVertical: "top",
    paddingVertical: 16,
    flex: 1,
    maxHeight: 138,
  },
  characterCountContainer: {
    justifyContent: "flex-end",
    padding: 8,
  },
  characterCount: {
    color: colors.grey,
    fontSize: 12,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  buttonScroll: {
    flex: 1,
    flexDirection: "row",
  },
  actionButtonContainer: {
    marginRight: 8,
  },
  sendButton: {
    marginLeft: 8,
    padding: 6,
    backgroundColor: colors.white,
    borderRadius: 50,
    alignSelf: "flex-end",
  },
  disabledSendButton: {
    backgroundColor: colors.grey,
  },
  characterCountExceeded: {
    color: colors.error,
  },
});

interface InputRadioButtonProps {
  id: string;
  label: string;
  value: string;
  selected: boolean;
  onPress: any;
}

interface InputProps {
  label?: string;
  labelSize?: "default" | "large";
  placeholder: string;
  value: string;
  setValue: (text: string) => void;
  autoComplete?: "email" | "password" | "off";
  secureTextEntry?: boolean;
  compact?: boolean;
  style?: any;
  showSendButton?: boolean;
  onSubmit?: () => void;
  transparent?: boolean;
  multiline?: boolean;
  includeActionBar?: boolean;
  actionButtons?: React.ReactNode[];
  characterLimit?: number;
  height?: DimensionValue;
  editable?: boolean;
  removeMarginBottom?: boolean;
  radioButtonProps?: InputRadioButtonProps;
  keyboardType?: KeyboardType;
  required?: boolean;
  description?: string;
  loading?: boolean;
}

const Input = ({
  label = "",
  labelSize = "default",
  description = "",
  placeholder,
  value,
  setValue,
  autoComplete,
  secureTextEntry,
  compact = false,
  style,
  showSendButton = false,
  onSubmit,
  transparent = false,
  multiline = false,
  includeActionBar = false,
  actionButtons = [],
  characterLimit,
  height,
  editable = true,
  removeMarginBottom = false,
  radioButtonProps,
  keyboardType = "default",
  required = false,
  loading = false,
}: InputProps) => {
  const isDisabled = value.trim() === "" || loading;
  const characterCount = value.length;

  return (
    <View
      style={[styles.container, { marginBottom: removeMarginBottom ? 0 : 16 }]}
    >
      {label && (
        <View
          style={[
            styles.labelContainer,
            { marginBottom: radioButtonProps ? 4 : 0 },
          ]}
        >
          <Text
            style={labelSize === "default" ? styles.label : styles.largeLabel}
          >
            {label} {required && <Text style={styles.required}> *</Text>}
          </Text>
          {radioButtonProps && (
            <RadioButton
              id={radioButtonProps.id}
              label={radioButtonProps.label}
              value={radioButtonProps.value}
              selected={radioButtonProps.selected}
              onPress={radioButtonProps.onPress}
              size={16}
              labelStyle={{ color: colors.grey, marginLeft: 6 }}
            />
          )}
        </View>
      )}
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            compact ? styles.compactInput : styles.regularInput,
            transparent && styles.transparentInput,
            multiline && styles.multilineInput,
            multiline && { height: height ? height : 138 },
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.grey}
          value={value}
          onChangeText={setValue}
          underlineColorAndroid="transparent"
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          scrollEnabled={multiline}
          maxLength={characterLimit}
          editable={editable}
          keyboardType={keyboardType}
        />

        {characterLimit && (
          <View
            style={[
              styles.characterCountContainer,
              { alignSelf: multiline ? "flex-end" : "center" },
            ]}
          >
            <Text
              style={[
                styles.characterCount,
                characterCount >= characterLimit
                  ? styles.characterCountExceeded
                  : null,
              ]}
            >
              {characterCount}/{characterLimit}
            </Text>
          </View>
        )}
      </View>

      {includeActionBar && (
        <View style={styles.actionBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.buttonScroll}
          >
            {actionButtons.map((button, index) => (
              <View key={index} style={styles.actionButtonContainer}>
                {button}
              </View>
            ))}
          </ScrollView>

          {showSendButton && (
            <TouchableOpacity
              style={[
                styles.sendButton,
                isDisabled && styles.disabledSendButton,
              ]}
              onPress={onSubmit}
              disabled={isDisabled}
            >
              <Ionicons
                name="arrow-up-sharp"
                size={20}
                color={colors.darkGrey}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default Input;
