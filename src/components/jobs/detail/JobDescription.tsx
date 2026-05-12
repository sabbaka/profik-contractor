import { colors } from "@/src/theme";
import { Text, YStack } from "tamagui";

interface JobDescriptionProps {
  description?: string;
}

export const JobDescription = ({ description }: JobDescriptionProps) => {
  if (!description) return null;

  return (
    <YStack paddingHorizontal="$4" gap="$2">
      <Text fontSize={16} fontWeight="700" color={colors.textPrimary}>
        Description
      </Text>
      <Text fontSize={14} color={colors.textSecondary} lineHeight={24}>
        {description}
      </Text>
    </YStack>
  );
};
