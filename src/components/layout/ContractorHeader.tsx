import { colors } from "@/src/theme";
import { useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContractorProfileHeaderButton from "../profile/ContractorProfileHeaderButton";

export default function ContractorHeader() {
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
      style={[
        styles.header,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.spacer} />
      <ContractorProfileHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: "auto",
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomColor: colors.border,
  },
  spacer: {
    flex: 1,
  },
});
