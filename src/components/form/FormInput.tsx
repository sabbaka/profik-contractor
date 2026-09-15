import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { AlertCircle } from "@tamagui/lucide-icons";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextInput as RNTextInput, TextInputProps } from "react-native";
import { XStack, YStack } from "tamagui";

interface FormInputProps<TFieldValues extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChange"
> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  placeholder?: string;
  error?: string;
  flex?: number;
  onValueChange?: (value: string) => void;
  /**
   * Optional leading element, inside the field rather than before it — a
   * dialling code belongs to the number the reader is checking, not to the
   * label above it.
   */
  prefix?: React.ReactNode;
  /** Optional trailing element (e.g. currency suffix). */
  suffix?: React.ReactNode;
  /**
   * Forwarded to the inner `TextInput`. Declared as a plain prop rather than
   * through `forwardRef`, which would erase this component's generic
   * parameter and force a cast — React 19 treats `ref` as an ordinary prop,
   * so it does not need one.
   */
  ref?: React.Ref<RNTextInput>;
}

/**
 * A field-shaped `XStack` around a raw `RNTextInput`, rather than Tamagui's
 * own `Input` — needed so `prefix`/`suffix` (a dialling-code picker, a
 * currency label) can sit inside the same rounded box as the text, not
 * beside it.
 */
export const FormInput = <TFieldValues extends FieldValues>({
  name,
  control,
  label,
  error,
  flex,
  onValueChange,
  style,
  prefix,
  suffix,
  ref,
  ...props
}: FormInputProps<TFieldValues>) => {
  const colors = useThemeColors();
  const hasError = !!error;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <YStack gap={6} flex={flex} width="100%">
          {label ? (
            <Text variant="sectionLabel" style={{ marginBottom: 2 }}>
              {label}
            </Text>
          ) : null}
          <XStack
            height={52}
            paddingHorizontal={16}
            borderRadius={12}
            alignItems="center"
            backgroundColor={hasError ? colors.dangerBg : colors.surfaceInput}
            borderWidth={hasError ? 1.5 : 0}
            borderColor={hasError ? colors.error : "transparent"}
            gap={8}
          >
            {prefix}
            <RNTextInput
              {...(props as any)}
              ref={ref}
              value={value?.toString() ?? ""}
              onBlur={onBlur}
              placeholderTextColor={colors.textMuted}
              onChangeText={(next) => {
                onValueChange?.(next);
                onChange(next);
              }}
              style={[
                {
                  flex: 1,
                  fontSize: 15,
                  fontFamily: "Inter_400Regular",
                  color: colors.textPrimary,
                  paddingVertical: 0,
                  height: "100%",
                },
                style,
              ]}
            />
            {suffix}
            {hasError && !suffix ? (
              <AlertCircle size={18} color={colors.error} />
            ) : null}
          </XStack>
          {error ? (
            <XStack
              alignItems="center"
              gap={6}
              paddingHorizontal={4}
              marginTop={2}
            >
              <AlertCircle size={14} color={colors.error} />
              <Text
                style={{
                  color: colors.error,
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                }}
              >
                {error}
              </Text>
            </XStack>
          ) : null}
        </YStack>
      )}
    />
  );
};
