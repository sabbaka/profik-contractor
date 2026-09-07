import { Card, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import type { WindowCleaningOption } from "@/src/api/types";
import { AppWindow, Bed, Home, Maximize2 } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

interface JobPropertySectionProps {
  roomsCount?: string;
  area?: number;
  windowCleaning?: WindowCleaningOption;
  windowCount?: number;
}

interface TileProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string;
  label: string;
}

function Tile({ Icon, value, label }: TileProps) {
  const colors = useThemeColors();
  return (
    <YStack
      flex={1}
      backgroundColor={colors.bgSecondary}
      borderRadius={12}
      paddingHorizontal={12}
      paddingVertical={14}
      gap={8}
    >
      <Icon size={20} color={colors.accent} />
      <YStack gap={2}>
        <Text
          style={{
            fontFamily: "Geist_700Bold",
            fontSize: 22,
            lineHeight: 26,
            color: colors.textPrimary,
          }}
        >
          {value}
        </Text>
        <Text variant="caption">{label}</Text>
      </YStack>
    </YStack>
  );
}

function formatWindowsValue(
  windowCleaning: JobPropertySectionProps["windowCleaning"],
  windowCount: JobPropertySectionProps["windowCount"],
): string {
  if (typeof windowCount === "number" && windowCount > 0) {
    return String(windowCount);
  }
  if (windowCleaning === "no") return "0";
  return "—";
}

export function JobPropertySection({
  roomsCount,
  area,
  windowCleaning,
  windowCount,
}: JobPropertySectionProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const hasAnyData =
    !!roomsCount ||
    typeof area === "number" ||
    !!windowCleaning ||
    typeof windowCount === "number";
  if (!hasAnyData) return null;

  return (
    <Card padding={16} gap={12}>
      <XStack alignItems="center" gap={8}>
        <Home size={18} color={colors.textMuted} />
        <Text variant="h5">{t("job.property.title")}</Text>
      </XStack>
      <XStack gap={10}>
        <Tile Icon={Bed} value={roomsCount ?? "—"} label={t("job.property.rooms")} />
        {windowCleaning === "yes" ? (
          <Tile
            Icon={AppWindow}
            value={formatWindowsValue(windowCleaning, windowCount)}
            label={t("job.property.windows")}
          />
        ) : null}
        <Tile
          Icon={Maximize2}
          value={typeof area === "number" ? `${area} m²` : "—"}
          label={t("job.property.area")}
        />
      </XStack>
    </Card>
  );
}
