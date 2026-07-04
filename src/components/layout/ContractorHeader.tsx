import { useThemeColors } from "@/src/theme";
import { useSegments } from "expo-router";
import { Text as UIText } from "@/src/components/ui/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";
import ContractorProfileHeaderButton from "../profile/ContractorProfileHeaderButton";

export default function ContractorHeader() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const isJobDetail = segments.includes("jobs") && segments.includes("[id]");
  const isOfferChat = segments.includes("offer-chat");
  const isBalancePage = segments.includes("balance");

  if (isJobDetail || isOfferChat || isBalancePage) {
    return null;
  }

  return (
    <XStack
      backgroundColor={colors.bgSecondary}
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={20}
      paddingTop={insets.top + 8}
      paddingBottom={8}
    >
      <YStack gap={1}>
        <UIText style={{ fontFamily: "Geist_700Bold", fontSize: 19, lineHeight: 23, color: colors.textPrimary }}>
          Profik <UIText style={{ color: colors.accent, fontFamily: "Geist_700Bold" }}>Pro</UIText>
        </UIText>
        <UIText variant="caption">Contractor workspace</UIText>
      </YStack>
      <ContractorProfileHeaderButton />
    </XStack>
  );
}
