import { Text } from "@/src/components/ui/ui";
import {
  listCountries,
  matchesCountryQuery,
  type Country,
} from "@/src/features/auth/phone";
import { useThemeColors } from "@/src/theme";
import { Check, Search, X } from "@tamagui/lucide-icons";
import type { CountryCode } from "libphonenumber-js";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, TextInput } from "react-native";
import { Sheet, XStack, YStack } from "tamagui";

interface CountryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: CountryCode;
  onSelect: (code: CountryCode) => void;
}

/**
 * The dialling-code picker behind the sign-in field's prefix.
 *
 * Searchable by name, ISO code or dialling code, because someone who knows
 * they are "+48" should not have to remember how the interface spells Poland.
 *
 * Unlike the app's other sheets this one keeps a fixed height rather than
 * fitting its content: the list is 245 rows long, and a sheet that grew to
 * hold them would cover the screen and then some.
 */
export function CountryPickerSheet({
  open,
  onOpenChange,
  selected,
  onSelect,
}: CountryPickerSheetProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");

  const countries = useMemo(
    () => listCountries(i18n.language),
    [i18n.language],
  );
  const visible = useMemo(
    () => countries.filter((c) => matchesCountryQuery(c, query)),
    [countries, query],
  );

  const choose = (country: Country) => {
    onSelect(country.code);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <Sheet
      // Not `modal`, matching ReviewSheet/NamePromptSheet/AppFeedbackSheet —
      // this is the pattern with a proven-working drag-to-dismiss gesture in
      // this app. The border this sheet used to draw around the whole screen
      // (and, it turned out, its broken drag gesture too) traced back to
      // where it was rendered from, not to `modal`: it sat nested inside
      // PhoneAuthScreen's KeyboardAwareScreen (a ScrollView), and a Sheet is
      // always absolutely positioned relative to its nearest positioned
      // ancestor — nested that deep, that ancestor was the ScrollView's
      // content container, not the screen. Now that it renders as a sibling
      // of the scrollable content (see PhoneAuthScreen.tsx), that's the
      // screen's own root again, matching every other sheet in this app.
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
      dismissOnSnapToBottom
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
            backgroundColor={colors.border}
          />
        </YStack>

        <XStack
          paddingHorizontal={20}
          paddingTop={8}
          paddingBottom={12}
          alignItems="center"
          justifyContent="space-between"
        >
          <Text variant="h5">{t("auth.country.title")}</Text>
          <Pressable
            onPress={() => onOpenChange(false)}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.close")}
            hitSlop={12}
          >
            <YStack
              width={32}
              height={32}
              borderRadius={9999}
              alignItems="center"
              justifyContent="center"
              backgroundColor={colors.bgSecondary}
            >
              <X size={18} color={colors.textSecondary} />
            </YStack>
          </Pressable>
        </XStack>

        <XStack
          marginHorizontal={20}
          marginBottom={12}
          height={44}
          paddingHorizontal={14}
          borderRadius={12}
          alignItems="center"
          gap={8}
          backgroundColor={colors.surfaceInput}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("auth.country.search")}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            // The list is already filtered as they type, so Search has
            // nothing left to do but close the keyboard — which is what it
            // should do.
            onSubmitEditing={Keyboard.dismiss}
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
              color: colors.textPrimary,
              paddingVertical: 0,
            }}
          />
        </XStack>

        {/* Sheet.ScrollView, not a FlatList: it registers itself with the
            sheet, so dragging inside the list scrolls it instead of pulling
            the sheet shut. A bare list leaves the sheet reading every
            downward drag as "dismiss me". */}
        <Sheet.ScrollView
          keyboardShouldPersistTaps="handled"
          // Dragging the list puts the keyboard away. Someone who opened the
          // search box and then decided to browse instead had no way to get
          // rid of it — there is nowhere on this sheet to tap that isn't a
          // country.
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {visible.length === 0 ? (
            <YStack paddingHorizontal={20} paddingTop={24} alignItems="center">
              <Text variant="caption">{t("auth.country.noResults")}</Text>
            </YStack>
          ) : (
            visible.map((item) => {
              const isSelected = item.code === selected;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => choose(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <XStack
                    paddingHorizontal={20}
                    minHeight={52}
                    alignItems="center"
                    gap={12}
                  >
                    <Text style={{ fontSize: 24, lineHeight: 30 }}>
                      {item.flag}
                    </Text>
                    <Text variant="bodySm" flex={1} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text
                      variant="bodySm"
                      style={{
                        color: colors.textMuted,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      +{item.callingCode}
                    </Text>
                    {isSelected ? (
                      <Check size={18} color={colors.accent} />
                    ) : (
                      <YStack width={18} />
                    )}
                  </XStack>
                </Pressable>
              );
            })
          )}
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
