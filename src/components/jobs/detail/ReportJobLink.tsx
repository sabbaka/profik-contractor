import { Text } from "@/src/components/ui/ui";
import { buildJobDetailReturnTo } from "@/src/features/auth/authReturnTo";
import { useThemeColors } from "@/src/theme";
import { Flag } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack } from "tamagui";

interface ReportJobLinkProps {
  jobId: string;
  isGuest: boolean;
  /** Opens the report sheet; only called for a signed-in contractor. */
  onReport: () => void;
}

/**
 * "Report job" at the foot of the job detail, where listings usually keep it:
 * findable by someone looking for it, out of the way of the offer.
 *
 * A guest sees it too and is taken to sign in — a report needs an account to
 * hang off, and hiding the link would leave a guest with no way to flag a job.
 * Signing in brings them back to this job, as the offer CTA does.
 */
export function ReportJobLink({
  jobId,
  isGuest,
  onReport,
}: ReportJobLinkProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const handlePress = () => {
    if (!isGuest) {
      onReport();
      return;
    }
    router.push({
      pathname: "/auth/login",
      params: { returnTo: buildJobDetailReturnTo(jobId) },
    } as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        alignSelf: "center",
        minHeight: 44,
        justifyContent: "center",
      })}
    >
      <XStack alignItems="center" gap={6}>
        <Flag size={14} color={colors.textMuted} />
        <Text variant="bodySm" style={{ color: colors.textMuted }}>
          {t("report.action.job")}
        </Text>
      </XStack>
    </Pressable>
  );
}
