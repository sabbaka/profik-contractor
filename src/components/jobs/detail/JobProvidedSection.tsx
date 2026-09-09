import { Card, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import type { EquipmentProvision, LadderOption } from "@/src/api/types";
import {
  Check,
  Package,
  SprayCan,
  WavesLadder,
  Wind,
  X,
} from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

type PillTone = "positive" | "negative" | "neutral";

interface StatusPillProps {
  label: string;
  tone: PillTone;
}

function StatusPill({ label, tone }: StatusPillProps) {
  const colors = useThemeColors();

  const palette: Record<
    PillTone,
    {
      bg: string;
      fg: string;
      Icon: React.ComponentType<{ size?: number; color?: string }>;
    }
  > = {
    positive: { bg: colors.greenSoftBg, fg: colors.greenStrong, Icon: Check },
    negative: { bg: colors.bgSecondary, fg: colors.textMuted, Icon: X },
    neutral: { bg: colors.bgSecondary, fg: colors.textSecondary, Icon: X },
  };

  const { bg, fg, Icon } = palette[tone];

  return (
    <XStack
      paddingHorizontal={10}
      paddingVertical={5}
      borderRadius={9999}
      backgroundColor={bg}
      alignItems="center"
      gap={4}
    >
      <Icon size={12} color={fg} />
      <Text
        style={{ color: fg, fontSize: 12, fontFamily: "Inter_600SemiBold" }}
      >
        {label}
      </Text>
    </XStack>
  );
}

interface RowProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  pill: StatusPillProps;
  isLast?: boolean;
}

function Row({ Icon, label, pill, isLast }: RowProps) {
  const colors = useThemeColors();
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingVertical={12}
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomColor={colors.divider}
    >
      <XStack alignItems="center" gap={10} flex={1}>
        <Icon size={18} color={colors.textSecondary} />
        <Text variant="bodyStrong">{label}</Text>
      </XStack>
      <StatusPill {...pill} />
    </XStack>
  );
}

interface JobProvidedSectionProps {
  vacuumCleaner?: EquipmentProvision | null;
  cleaningSupplies?: EquipmentProvision | null;
  ladder?: LadderOption | null;
}

export function JobProvidedSection({
  vacuumCleaner,
  cleaningSupplies,
  ladder,
}: JobProvidedSectionProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const hasAny = !!vacuumCleaner || !!cleaningSupplies || !!ladder;
  if (!hasAny) return null;

  const provisionToPill = (
    value?: EquipmentProvision | null,
  ): StatusPillProps => {
    if (value === "have")
      return { label: t("job.provided.onSite"), tone: "positive" };
    if (value === "bring")
      return { label: t("job.provided.notIncluded"), tone: "negative" };
    return { label: "—", tone: "neutral" };
  };

  const ladderToPill = (value?: LadderOption | null): StatusPillProps => {
    if (value === "available")
      return { label: t("job.provided.onSite"), tone: "positive" };
    if (value === "needed")
      return { label: t("job.provided.notIncluded"), tone: "negative" };
    if (value === "noneeded")
      return { label: t("job.provided.notNeeded"), tone: "neutral" };
    return { label: "—", tone: "neutral" };
  };

  return (
    <Card padding={16} paddingVertical={4} gap={0}>
      <XStack alignItems="center" gap={8} paddingTop={12} paddingBottom={4}>
        <Package size={18} color={colors.textMuted} />
        <Text variant="h5">{t("job.provided.title")}</Text>
      </XStack>
      <YStack>
        <Row
          Icon={Wind}
          label={t("job.provided.vacuum")}
          pill={provisionToPill(vacuumCleaner)}
        />
        <Row
          Icon={SprayCan}
          label={t("job.provided.supplies")}
          pill={provisionToPill(cleaningSupplies)}
        />
        <Row
          Icon={WavesLadder}
          label={t("job.provided.ladder")}
          pill={ladderToPill(ladder)}
          isLast
        />
      </YStack>
    </Card>
  );
}
