import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

export const JobDescription = ({ description }: { description?: string }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  if (!description) return null;
  return (
    <YStack padding={18} borderRadius={18} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={8}>
      <Text variant="h5">{t("job.about")}</Text>
      <Text variant="body" style={{ lineHeight: 23 }}>{description}</Text>
    </YStack>
  );
};
