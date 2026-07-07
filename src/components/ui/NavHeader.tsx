import { ChevronLeft, X } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";
import { Text } from "./ui";

interface NavHeaderProps {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  /** Show "Back" label next to the chevron (matches NavHeader in design). */
  showBackLabel?: boolean;
  /** Tint colour overrides (used on hero gradient screens). */
  tint?: string;
  /** Right-side custom content (Share icon, etc.). */
  right?: React.ReactNode;
  /** Hide back chevron entirely. */
  hideBack?: boolean;
}

/**
 * 44h navigation header from Penpot:
 *   ◀ Back          [optional title]               ✕ / ⋯ / share
 */
export function NavHeader({
  title,
  onBack,
  onClose,
  showBackLabel = true,
  tint,
  right,
  hideBack,
}: NavHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const color = tint ?? theme.textPrimary?.val ?? "#1A1D2E";
  const mutedColor = tint ?? theme.textMuted?.val ?? "#9CA3AF";

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };
  const handleClose = () => {
    if (onClose) return onClose();
    if (router.canGoBack()) router.back();
  };

  return (
    <XStack
      height={44}
      ai="center"
      jc="space-between"
      paddingHorizontal={20}
    >
      {!hideBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <XStack ai="center" gap={4}>
            <ChevronLeft size={24} color={color} />
            {showBackLabel ? (
              <Text
                style={{
                  color,
                  fontSize: 17,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("common.back")}
              </Text>
            ) : null}
          </XStack>
        </Pressable>
      ) : (
        <XStack width={24} />
      )}

      {title ? (
        <Text variant="h5" style={{ color }}>
          {title}
        </Text>
      ) : null}

      {right ? (
        right
      ) : onClose ? (
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <X size={24} color={mutedColor} />
        </Pressable>
      ) : (
        <XStack width={24} />
      )}
    </XStack>
  );
}

export default NavHeader;
