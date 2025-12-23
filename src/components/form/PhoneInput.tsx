import { Control, Controller } from "react-hook-form";
import MaskInput from "react-native-mask-input";
import { Label, Text, YStack } from "tamagui";

interface PhoneInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  error?: string;
  flex?: number;
  defaultCountryCode?: string;
}

const CZECH_PHONE_MASK = [
  "+",
  "4",
  "2",
  "0",
  " ",
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
];

const INTERNATIONAL_PHONE_MASK = [
  "+",
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
];

export const PhoneInput = ({
  name,
  control,
  label,
  error,
  flex = 1,
  placeholder = "+420 XXX XXX XXX",
  defaultCountryCode = "CZ",
}: PhoneInputProps) => {
  const mask =
    defaultCountryCode === "CZ" ? CZECH_PHONE_MASK : INTERNATIONAL_PHONE_MASK;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <YStack gap="$2" flex={flex}>
          {label && (
            <Label fontSize="$3" color="$gray10">
              {label}
            </Label>
          )}
          <MaskInput
            mask={mask}
            value={value?.toString() || ""}
            onBlur={onBlur}
            onChangeText={(masked, unmasked) => {
              onChange(masked);
            }}
            placeholder={placeholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: "#1a1a1a",
              borderWidth: error ? 1 : 0,
              borderColor: error ? "#e54545" : "transparent",
            }}
            placeholderTextColor="#999"
          />
          {error && (
            <Text color="$red10" fontSize="$2" marginLeft="$1">
              {error}
            </Text>
          )}
        </YStack>
      )}
    />
  );
};

// Хелпер для извлечения чистого номера (без маски)
export const extractPhoneNumber = (maskedPhone: string): string => {
  return maskedPhone.replace(/\D/g, "");
};

// Хелпер для валидации чешского номера
export const isValidCzechPhone = (phone: string): boolean => {
  const digits = extractPhoneNumber(phone);
  // Чешский номер: 420 + 9 цифр = 12 цифр
  return digits.length === 12 && digits.startsWith("420");
};
