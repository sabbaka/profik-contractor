import { useThemeColors } from "@/src/theme";
import { Control, Controller } from "react-hook-form";
import { Input, InputProps, Label, Text, YStack } from "tamagui";

interface FormInputProps extends InputProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  error?: string;
  flex?: number;
}

export const FormInput = ({
  name,
  control,
  label,
  error,
  flex = 1,
  ...props
}: FormInputProps) => {
  const colors = useThemeColors();

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
          <Input
            {...props}
            value={value == null ? "" : String(value)}
            onBlur={onBlur}
            onChangeText={onChange}
            borderWidth={displayError ? 1 : 0}
            borderColor={displayError ? colors.error : colors.border}
            backgroundColor={colors.surfaceInput}
            color={colors.textPrimary}
            placeholderTextColor={colors.textMuted}
            focusStyle={{ borderColor: displayError ? colors.error : colors.border, borderWidth: 1 }}
            paddingVertical={"$4"}
            height={"auto"}
            borderRadius={12}
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
