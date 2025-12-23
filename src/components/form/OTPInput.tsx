import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, TextInput } from "react-native";
import { Text, XStack, YStack, styled } from "tamagui";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}

const OTPBox = styled(XStack, {
  width: 52,
  height: 60,
  borderRadius: 12,
  backgroundColor: "$gray3",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  borderColor: "transparent",

  variants: {
    focused: {
      true: {
        borderColor: "$gray12",
        backgroundColor: "$gray2",
      },
    },
    filled: {
      true: {
        backgroundColor: "$gray4",
      },
    },
    hasError: {
      true: {
        borderColor: "$gray12",
      },
    },
  } as const,
});

const OTPDigit = styled(Text, {
  fontSize: 28,
  fontWeight: "700",
  color: "$gray12",
  textAlign: "center",
});

export const OTPInput = ({
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
}: OTPInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    setFocusedIndex(value.length < length ? value.length : length - 1);
  }, [value, length]);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(cleaned);

    if (cleaned.length === length) {
      Keyboard.dismiss();
    }
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const digits = value.split("");

  return (
    <YStack gap="$3" alignItems="center">
      <XStack gap="$3" onPress={handlePress} cursor="pointer">
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const isFocused = focused && index === focusedIndex;
          const isFilled = digit !== "";

          return (
            <OTPBox
              key={index}
              focused={isFocused}
              filled={isFilled}
              hasError={!!error}
              animation="quick"
              pressStyle={{ scale: 0.98 }}
              onPress={handlePress}
            >
              <OTPDigit>{digit}</OTPDigit>
              {isFocused && !digit && (
                <XStack
                  position="absolute"
                  width={2}
                  height={28}
                  backgroundColor="$gray12"
                  animation="quick"
                  opacity={1}
                />
              )}
            </OTPBox>
          );
        })}
      </XStack>

      {error && (
        <Text color="$red10" fontSize="$3" textAlign="center">
          {error}
        </Text>
      )}

      {/* Hidden input for keyboard */}
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
