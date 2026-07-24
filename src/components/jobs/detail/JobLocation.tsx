import { useThemeColors } from "@/src/theme";
import { Text } from "@/src/components/ui/ui";
import { MapPin } from "@tamagui/lucide-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";
import MapPreview from "../../MapPreview";

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
  const { t } = useTranslation();
  const colors = useThemeColors();
  const addressText = useMemo(() => {
    return [addressLine, city, postalCode, country].filter(Boolean).join(", ");
  }, [addressLine, city, postalCode, country]);

  const hasLocation = addressText || (lat && lng);

  if (!hasLocation) return null;

  return (
    <YStack padding={18} gap={12} borderRadius={18} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle}>
      <Text variant="h5">
        {t("job.location")}
      </Text>
      {addressText && (
        <XStack gap="$2" alignItems="center">
          <MapPin size={20} color={colors.textMuted} />
          <Text variant="bodySm" flex={1}>
            {addressText}
          </Text>
        </XStack>
      )}
      {!addressLine && (
        <Text variant="caption" style={{ color: colors.textMuted }}>
          {t("job.exactAddressAfterAccept")}
        </Text>
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
