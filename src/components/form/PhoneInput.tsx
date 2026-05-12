import { useThemeColors } from "@/src/theme";
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
  "+", "4", "2", "0", " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/,
];

const INTERNATIONAL_PHONE_MASK = [
  "+", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/,
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
  const colors = useThemeColors();
  const mask = defaultCountryCode === "CZ" ? CZECH_PHONE_MASK : INTERNATIONAL_PHONE_MASK;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState }) => {
        const displayError = error ?? fieldState.error?.message;

        return (
          <YStack gap="$2" flex={flex}>
          {label && (
            <Label fontSize="$3" color={colors.textSecondary}>
              {label}
            </Label>
          )}
          <MaskInput
            mask={mask}
            value={value?.toString() || ""}
            onBlur={onBlur}
            onChangeText={(masked) => { onChange(masked); }}
            placeholder={placeholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={{
              backgroundColor: colors.surfaceInput,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: colors.textPrimary,
              borderWidth: displayError ? 1 : 0,
              borderColor: displayError ? colors.error : "transparent",
            }}
            placeholderTextColor={colors.textMuted}
          />
          {displayError ? (
            <Text color={colors.error} fontSize="$2" marginLeft="$1">
              {displayError}
            </Text>
          ) : null}
          </YStack>
        );
      }}
    />
  );
};

export const extractPhoneNumber = (maskedPhone: string): string => {
  return maskedPhone.replace(/\D/g, "");
};

export const isValidCzechPhone = (phone: string): boolean => {
  const digits = extractPhoneNumber(phone);
  return digits.length === 12 && digits.startsWith("420");
};
