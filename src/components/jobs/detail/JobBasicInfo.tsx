import { Text } from "@/src/components/ui/ui";
import { formatCzk } from "@/src/utils/currency";
import { Calendar, MapPin } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

interface JobBasicInfoProps { category?: string; title: string; price: number; createdAt?: string; city?: string }

export const JobBasicInfo = ({ category, title, price, createdAt, city }: JobBasicInfoProps) => {
  const { t, i18n } = useTranslation();
  const date = useMemo(() => {
    if (!createdAt) return "";
    try { return new Date(createdAt).toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" }); } catch { return ""; }
  }, [createdAt, i18n.language]);

  return (
    <YStack borderRadius={24} overflow="hidden" padding={22} gap={16}>
      <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <YStack position="relative" zIndex={1} gap={7}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>{category || t("job.serviceRequest")}</Text>
        <Text style={{ color: "#FFFFFF", fontFamily: "Geist_700Bold", fontSize: 27, lineHeight: 33 }}>{title}</Text>
        <Text style={{ color: "#FFFFFF", fontFamily: "GeistMono_700Bold", fontSize: 25, lineHeight: 31 }}>{formatCzk(price)}</Text>
      </YStack>
      <XStack position="relative" zIndex={1} gap={18} flexWrap="wrap">
        {date ? <Meta icon={<Calendar size={15} color="#FFFFFF" />} label={date} /> : null}
        <Meta icon={<MapPin size={15} color="#FFFFFF" />} label={city || t("job.remote")} />
      </XStack>
    </YStack>
  );
};

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <XStack alignItems="center" gap={6}>{icon}<Text style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Inter_500Medium", fontSize: 13 }}>{label}</Text></XStack>;
}
