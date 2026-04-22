import { formatCzk } from "@/src/utils/currency";
import { Clock, MapPin } from "@tamagui/lucide-icons";
import { useMemo } from "react";
import { Text, XStack, YStack } from "tamagui";

interface JobBasicInfoProps {
  category?: string;
  title: string;
  price: number;
  createdAt?: string;
  city?: string;
}

export const JobBasicInfo = ({
  category,
  title,
  price,
  createdAt,
  city,
}: JobBasicInfoProps) => {
  const formattedPrice = useMemo(() => formatCzk(price), [price]);

  const formattedDate = useMemo(() => {
    if (!createdAt) return "";
    try {
      return new Intl.DateTimeFormat("en-US").format(new Date(createdAt));
    } catch {
      return "";
    }
  }, [createdAt]);

  const cityText = city || "Remote";

  return (
    <YStack paddingHorizontal="$4" paddingTop="$2" gap="$2">
      {category && (
        <Text fontSize={12} color="$gray10">
          {category}
        </Text>
      )}
      <Text fontSize={28} fontWeight="800" lineHeight={34}>
        {title}
      </Text>
      <Text fontSize={24} fontWeight="800" color="$color" letterSpacing={-0.5}>
        {formattedPrice}
      </Text>
      <XStack gap="$4" marginTop="$2">
        {formattedDate && (
          <XStack gap="$2" alignItems="center">
            <Clock size={18} color="$gray10" />
            <Text fontSize={14} color="$gray11">
              {formattedDate}
            </Text>
          </XStack>
        )}
        <XStack gap="$2" alignItems="center">
          <MapPin size={18} color="$gray10" />
          <Text fontSize={14} color="$gray11">
            {cityText}
          </Text>
        </XStack>
      </XStack>
    </YStack>
  );
};

