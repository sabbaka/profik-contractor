import { useThemeColors } from "@/src/theme";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, TextInput } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export const OTPInput = ({
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
}: OTPInputProps) => {
  const colors = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => { inputRef.current?.focus(); }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    setFocusedIndex(value.length < length ? value.length : length - 1);
  }, [value, length]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) Keyboard.dismiss();
  };

  const handlePress = () => { inputRef.current?.focus(); };
  const digits = value.split("");

  return (
    <YStack gap="$3" alignItems="center">
      <XStack gap="$3" onPress={handlePress} cursor="pointer">
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const isFocused = focused && index === focusedIndex;
          const isFilled = digit !== "";

          return (
            <XStack
              key={index}
              width={52}
              height={60}
              borderRadius={12}
              backgroundColor={isFilled ? colors.bgCard : colors.surfaceInput}
              alignItems="center"
              justifyContent="center"
              borderWidth={2}
              borderColor={error ? colors.error : isFocused ? colors.accent : "transparent"}
              animation="quick"
              pressStyle={{ scale: 0.98 }}
              onPress={handlePress}
            >
              <Text fontSize={28} fontWeight="700" color={colors.textPrimary} textAlign="center">
                {digit}
              </Text>
              {isFocused && !digit && (
                <XStack
                  position="absolute"
                  width={2}
                  height={28}
                  backgroundColor={colors.accent}
                  animation="quick"
                  opacity={1}
                />
              )}
            </XStack>
          );
        })}
      </XStack>

      {error && (
        <Text color={colors.error} fontSize="$3" textAlign="center">
          {error}
        </Text>
      )}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        style={{
          position: "absolute",
          opacity: 0,
          height: 1,
          width: 1,
          ...(Platform.OS === "web" && { pointerEvents: "none" }),
        }}
      />
    </YStack>
  );
};
