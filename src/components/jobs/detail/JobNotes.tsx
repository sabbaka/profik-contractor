import { Card, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { StickyNote } from "@tamagui/lucide-icons";
import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

export const JobNotes = ({ notes }: { notes?: string }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  if (!notes) return null;
  return (
    <Card padding={18} gap={8}>
      <XStack alignItems="center" gap={8}>
        <StickyNote size={18} color={colors.textMuted} />
        <Text variant="h5">{t("job.notes")}</Text>
      </XStack>
      <Text variant="body">{notes}</Text>
    </Card>
  );
};
