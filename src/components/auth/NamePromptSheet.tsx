import { FormInput } from "@/src/components/form";
import { Button, Text } from "@/src/components/ui/ui";
import { useEditProfileForm } from "@/src/features/auth/hooks/useEditProfileForm";
import { useThemeColors } from "@/src/theme";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, TextInput, TouchableWithoutFeedback } from "react-native";
import { Sheet, YStack } from "tamagui";

interface NamePromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the name is saved, so the gated action can resume. */
  onSaved: () => void;
}

/**
 * Asks for a display name at the one moment it matters — sending an offer —
 * for accounts created with nothing but a phone number. Driven by
 * `useNameGate`; dismissing it abandons the offer rather than sending it
 * anonymously, since the client picks between offers by who they're from.
 *
 * Reuses `useEditProfileForm`, so this writes to the same `PATCH /users/me`
 * as the Edit Profile screen and the name shows up there afterwards.
 */
export function NamePromptSheet({
  open,
  onOpenChange,
  onSaved,
}: NamePromptSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { form, submit, isLoading } = useEditProfileForm({
    name: "",
    email: "",
  });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!open) {
      form.reset({ name: "", email: "" });
      return;
    }
    // The input stays mounted while the sheet is closed (non-modal Sheets
    // don't unmount their children), so focusing it must be driven by
    // `open` rather than `autoFocus` — otherwise it grabs the keyboard as
    // soon as the screen that renders this sheet opens. The delay lets the
    // sheet's open animation start first.
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open, form]);

  const handleSave = async () => {
    const result = await submit();
    if (result.success) {
      onSaved();
      return;
    }
    Alert.alert(t("common.error"), result.error);
  };

  return (
    <Sheet
      // Not `modal`: a modal Sheet portals to the app root, which on iOS sits
      // *underneath* a native fullScreenModal — the prompt then renders
      // invisibly and the button it gates looks like it does nothing.
      // Rendering in place keeps it inside whichever screen opened it.
      modal={false}
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[42]}
      dismissOnSnapToBottom
      zIndex={100_000}
      animation="medium"
      moveOnKeyboardChange
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <YStack paddingHorizontal={20} paddingBottom={32} gap={20}>
            <YStack gap={6} paddingTop={8}>
              <Text variant="h3">{t("auth.name.title")}</Text>
              <Text variant="body">{t("auth.name.subtitle")}</Text>
            </YStack>

            <FormInput
              ref={inputRef}
              name="name"
              control={form.control}
              placeholder={t("auth.placeholders.name")}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              error={form.formState.errors.name?.message}
              flex={0}
            />

            <Button loading={isLoading} onPress={handleSave}>
              {t("auth.name.save")}
            </Button>
          </YStack>
        </TouchableWithoutFeedback>
      </Sheet.Frame>
    </Sheet>
  );
}
