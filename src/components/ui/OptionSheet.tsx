import { Text } from "@/src/components/ui/ui";
import { Check } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, XStack, YStack } from "tamagui";

import { useThemeColors } from "@/src/theme";

export interface OptionSheetOption<T extends string> {
  value: T;
  label: string;
}

interface OptionSheetProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: OptionSheetOption<T>[];
  /** Ticked in the list, so the sheet says what the setting is now. */
  selected?: T;
  onSelect: (value: T) => void;
}

/**
 * Picks one of a short list of settings — the interface language, the
 * appearance.
 *
 * Replaces `Alert.alert` with buttons, which iOS renders as a
 * `UIAlertController` in alert style: it cannot be dismissed by tapping
 * outside it, and there is no prop for that. With three or four choices iOS
 * also stacks the buttons vertically, so it looked like a sheet and refused to
 * behave like one. This dismisses on a tap outside and on a downward drag, and
 * it follows the app's own theme rather than the system's.
 *
 * `modal`, unlike the name prompt: nothing here opens from inside a native
 * fullScreenModal, and a modal sheet is what puts the overlay above the tab
 * bar.
 */
export function OptionSheet<T extends string>({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onSelect,
}: OptionSheetProps<T>) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const choose = (value: T) => {
    onSelect(value);
    onOpenChange(false);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress
      zIndex={200_000}
      animation="medium"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        backgroundColor={colors.bgPrimary}
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
      >
        <YStack alignItems="center" paddingTop={10} paddingBottom={6}>
          <YStack
            width={36}
            height={4}
            borderRadius={9999}
            backgroundColor={colors.borderSubtle}
          />
        </YStack>

        <YStack paddingHorizontal={20} paddingTop={8} paddingBottom={12}>
          <Text variant="h5">{title}</Text>
        </YStack>

        <YStack paddingBottom={insets.bottom + 12}>
          {options.map((option, idx) => (
            <React.Fragment key={option.value}>
              {idx > 0 ? (
                <YStack
                  height={1}
                  marginHorizontal={20}
                  backgroundColor={colors.borderSubtle}
                />
              ) : null}
              <Pressable
                onPress={() => choose(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === selected }}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <XStack
                  paddingHorizontal={20}
                  minHeight={52}
                  alignItems="center"
                  justifyContent="space-between"
                  gap={12}
                >
                  <Text variant="body">{option.label}</Text>
                  {option.value === selected ? (
                    <Check size={18} color={colors.accent} />
                  ) : null}
                </XStack>
              </Pressable>
            </React.Fragment>
          ))}

          {/* Separates Cancel from the choices, the same weight as the rules
              between them — it was written without a colour and rendered as an
              invisible 1px gap. */}
          <YStack
            height={1}
            marginHorizontal={20}
            marginTop={8}
            backgroundColor={colors.borderSubtle}
          />
          <Pressable
            onPress={() => onOpenChange(false)}
            accessibilityRole="button"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <XStack
              paddingHorizontal={20}
              minHeight={52}
              alignItems="center"
              justifyContent="center"
            >
              <Text
                variant="bodyStrong"
                style={{ color: colors.textSecondary }}
              >
                {t("common.cancel")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
