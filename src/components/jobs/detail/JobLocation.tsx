import { useThemeColors } from "@/src/theme";
import { MapPin } from "@tamagui/lucide-icons";
import { useMemo } from "react";
import { Text, XStack, YStack } from "tamagui";
import MapPreview from "../../MapPreview.native";

interface JobLocationProps {
  addressLine?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export const JobLocation = ({
  addressLine,
  city,
  postalCode,
  country,
  lat,
  lng,
}: JobLocationProps) => {
  const colors = useThemeColors();
  const addressText = useMemo(() => {
    return [addressLine, city, postalCode, country].filter(Boolean).join(", ");
  }, [addressLine, city, postalCode, country]);

  const hasLocation = addressText || (lat && lng);

  if (!hasLocation) return null;

  return (
    <YStack paddingHorizontal="$4" gap="$3">
      <Text fontSize={16} fontWeight="700" color={colors.textPrimary}>
        Location
      </Text>
      {addressText && (
        <XStack gap="$2" alignItems="center">
          <MapPin size={20} color={colors.textMuted} />
          <Text fontSize={14} color={colors.textSecondary}>
            {addressText}
          </Text>
        </XStack>
      )}
      <YStack height="auto" borderRadius="$6" overflow="hidden">
        {lat && lng ? (
          <MapPreview lat={lat} lng={lng} />
        ) : addressText ? (
          <MapPreview address={addressText} />
        ) : null}
      </YStack>
    </YStack>
  );
};
