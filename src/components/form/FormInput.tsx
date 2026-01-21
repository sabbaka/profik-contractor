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
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState }) => {
        const displayError = error ?? fieldState.error?.message;

        return (
          <YStack gap="$2" flex={flex}>
          {label && (
            <Label fontSize="$3" color="$gray10">
              {label}
            </Label>
          )}
          <Input
            {...props}
            value={value == null ? "" : String(value)}
            onBlur={onBlur}
            onChangeText={onChange}
            borderWidth={displayError ? 1 : 0}
            borderColor={displayError ? "$red8" : "$gray6"}
            focusStyle={{ borderColor: displayError ? "$red8" : "$red8" }}
            paddingVertical={"$4"}
            height={"auto"}
          />
          {displayError ? (
            <Text color="$red10" fontSize="$2" marginLeft="$1">
              {displayError}
            </Text>
          ) : null}
          </YStack>
        );
      }}
    />
  );
};
