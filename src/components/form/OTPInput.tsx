import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, TextInput } from "react-native";
import { XStack, YStack } from "tamagui";

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
  const focusedIndex = value.length < length ? value.length : length - 1;

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) Keyboard.dismiss();
  };

  const focusInput = () => inputRef.current?.focus();
  const digits = value.split("");
  const hasError = !!error;

  return (
    <YStack gap={12} alignItems="center">
      <XStack gap={10}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const isFocused = focused && index === focusedIndex;
          return (
            <Pressable
              key={index}
              onPress={focusInput}
              style={({ pressed }) =>
                pressed ? { transform: [{ scale: 0.97 }] } : null
              }
            >
              <YStack
                width={48}
                height={56}
                borderRadius={12}
                alignItems="center"
                justifyContent="center"
                backgroundColor={
                  hasError
                    ? colors.dangerBg
                    : isFocused
                      ? colors.accentLight
                      : colors.surfaceInput
                }
                borderWidth={hasError ? 1.5 : isFocused ? 2 : 0}
                borderColor={
                  hasError
                    ? colors.error
                    : isFocused
                      ? colors.accent
                      : "transparent"
                }
              >
                <Text
                  style={{
                    fontSize: 24,
                    lineHeight: 30,
                    fontFamily: "Inter_700Bold",
                    color: colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  {digit}
                </Text>
                {isFocused && !digit ? (
                  <YStack
                    position="absolute"
                    width={2}
                    height={26}
                    backgroundColor={colors.accent}
                  />
                ) : null}
              </YStack>
            </Pressable>
          );
        })}
      </XStack>

      {error ? (
        <Text
          variant="caption"
          textAlign="center"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      ) : null}

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
          ...(Platform.OS === "web" && { pointerEvents: "none" as any }),
        }}
      />
    </YStack>
  );
};
