import { useThemeColors } from "@/src/theme";
import { useSegments } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    <View
      style={{
        height: "auto",
        backgroundColor: colors.bgSecondary,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomColor: colors.border,
        paddingTop: insets.top,
      }}
    >
      <View style={{ flex: 1 }} />
      <ContractorProfileHeaderButton />
    </View>
  );
}
