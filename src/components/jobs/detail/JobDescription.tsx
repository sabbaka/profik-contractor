import { Text, YStack } from "tamagui";

interface JobDescriptionProps {
  description?: string;
}

export const JobDescription = ({ description }: JobDescriptionProps) => {
  if (!description) return null;

  return (
    <YStack paddingHorizontal="$4" gap="$2">
      <Text fontSize={16} fontWeight="700">
        Description
      </Text>
      <Text fontSize={14} color="$gray11" lineHeight={24}>
        {description}
      </Text>
    </YStack>
  );
};

