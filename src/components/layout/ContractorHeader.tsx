import { useTabBarVisibility } from "@/src/context/TabBarVisibilityContext";
import { useThemeColors } from "@/src/theme";
import { useSegments } from "expo-router";
import { Text as UIText } from "@/src/components/ui/ui";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";
import ContractorProfileHeaderButton from "../profile/ContractorProfileHeaderButton";

export default function ContractorHeader() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  // The Open Jobs filter sheet (see `OpenJobsFiltersSheet.tsx`) is
  // non-modal, so its own `Sheet.Overlay` only darkens the tab content
  // beneath it — this header is a sibling further up the tree and paints
  // untouched above it. Reusing the same `hidden` signal that already hides
  // the TabBar for that sheet, so the header dims (and stops accepting
  // taps) in step with it rather than sitting lit above a dimmed screen.
  const { hidden } = useTabBarVisibility();

  const isJobDetail = segments.includes("jobs") && segments.includes("[id]");
  const isOfferChat = segments.includes("offer-chat");
  const isBalancePage = segments.includes("balance");
  // Only ever mounted inside the tabs stack, so this segment alone means the
  // Profile tab — the header's own profile button would just point back at
  // the screen already on.
  const isProfileTab = segments.includes("profile");

  if (isJobDetail || isOfferChat || isBalancePage) {
    return null;
  }

  return (
    <XStack
      position="relative"
      backgroundColor={colors.bgSecondary}
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={20}
      paddingTop={insets.top + 8}
      paddingBottom={8}
    >
      <YStack gap={1}>
        <UIText
          style={{
            fontFamily: "InterTight_700Bold",
            fontSize: 19,
            lineHeight: 23,
            color: colors.textPrimary,
          }}
        >
          Profik{" "}
          <UIText
            style={{ color: colors.accent, fontFamily: "InterTight_700Bold" }}
          >
            Pro
          </UIText>
        </UIText>
        <UIText variant="caption">{t("header.workspace")}</UIText>
      </YStack>
      {isProfileTab ? null : <ContractorProfileHeaderButton />}
      {hidden ? (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          pointerEvents="auto"
        />
      ) : null}
    </XStack>
  );
}
