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
      render={({ field: { onChange, onBlur, value } }) => (
        <YStack gap="$2" flex={flex}>
          {label && (
            <Label fontSize="$3" color="$gray10">
              {label}
            </Label>
          )}
          <Input
            {...props}
            value={value?.toString()}
            onBlur={onBlur}
            onChangeText={onChange}
            borderColor={error ? "$red8" : "$gray6"}
            borderWidth={0}
            paddingVertical={"$4"}
            height={"auto"}
            focusStyle={{ borderColor: error ? "$red8" : "$red10" }}
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
