import { Check, FileText } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack } from "tamagui";

import { useAcceptTermsMutation, useMeQuery } from "@/src/api/profikApi";
import { Button, Text } from "@/src/components/ui/ui";
import {
  isFirstAcceptance,
  privacyUrlOf,
  termsUrlOf,
  toCachedTerms,
} from "@/src/features/auth/terms";
import { extractErrorMessage } from "@/src/features/auth/types";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useThemeColors } from "@/src/theme";
import { setCachedTerms } from "@/src/utils/termsStorage";
import { openLegalDocument } from "@/src/utils/openLegalDocument";

/**
 * The one screen where the Terms are accepted, shown to a signed-in account
 * that has not accepted the edition in force.
 *
 * It is reached in two ways and looks the same in both: straight after a code
 * is verified, and at launch from `AuthGate`. Which one it is does not matter —
 * the server answers a single question, "does this account owe an acceptance",
 * and that is what raises the screen. A returning person who has already
 * agreed never sees it, which is the whole reason the checkbox lives here and
 * not under the phone field.
 *
 * Two things it deliberately does not do. It does not carry the text of the
 * Terms: the binding document is the one published at profik.app, and a second
 * copy inside the app would be a second edition to keep in step. And it cannot
 * be dismissed — there is no back button, no swipe, and the route is redirected
 * back to while the acceptance is owed. The way out is Accept or Sign out, and
 * the second one has to be there, or the screen is a trap rather than a choice.
 */
export function TermsGateScreen({ returnTo }: { returnTo?: string }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data: me, refetch } = useMeQuery();
  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terms = me?.terms;
  // The copy is the only difference between a first acceptance and a revision.
  // "Please review these" reads as nonsense to someone who agreed last year,
  // and "these have changed" reads as nonsense to someone who just signed up.
  const first = isFirstAcceptance(terms);

  const openDocument = async (url: string) => {
    if (!(await openLegalDocument(url))) {
      Alert.alert(t("common.error"), t("terms.gate.linkFailed"));
    }
  };

  const handleAccept = async () => {
    if (!terms) return;
    setError(null);
    try {
      const result = await acceptTerms({
        version: terms.currentVersion,
        locale: i18n.language,
      }).unwrap();

      const cached = toCachedTerms(result.terms);
      if (cached) await setCachedTerms(cached);

      router.replace((returnTo ?? "/(contractor)/(tabs)/open") as any);
    } catch (err) {
      // 409 means the documents were revised between this screen rendering and
      // the tap. Refetching is the fix rather than a retry: the new version,
      // the new links and the new wording all arrive together.
      setError(extractErrorMessage(err, t));
      void refetch();
    }
  };

  const handleSignOut = () => {
    Alert.alert(t("terms.gate.signOutTitle"), t("terms.gate.signOutBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("terms.gate.signOut"),
        style: "destructive",
        // Nothing is deleted. The account stays exactly as it is and this
        // screen comes back on the next sign-in, which is what "decide later"
        // has to mean for it to be a real choice. The ordinary sign-out is
        // reused so the push token is released here as it is everywhere else.
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <YStack flex={1} backgroundColor="$bgPrimary">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 32,
          paddingBottom: 24,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack ai="center" gap={12}>
          <YStack
            width={64}
            height={64}
            borderRadius={32}
            ai="center"
            jc="center"
            backgroundColor="$accentLight"
          >
            <FileText size={28} color={colors.accent} />
          </YStack>
          <Text variant="h2" textAlign="center">
            {first ? t("terms.gate.firstTitle") : t("terms.gate.updatedTitle")}
          </Text>
          <Text variant="body" textAlign="center" color="$textSecondary">
            {first ? t("terms.gate.firstBody") : t("terms.gate.updatedBody")}
          </Text>
        </YStack>

        {/* A plain-language summary in the reader's own language. The binding
            document is Czech and stays that way — this is what stops someone
            agreeing to a text they cannot read at all. */}
        <YStack
          gap={10}
          padding={16}
          borderRadius={16}
          backgroundColor="$bgCard"
          borderWidth={1}
          borderColor="$borderSubtle"
        >
          <Text variant="bodyStrong">{t("terms.gate.summaryTitle")}</Text>
          {["platform", "contract", "money", "leaving"].map((key) => (
            <XStack key={key} gap={8} ai="flex-start">
              <Text variant="body" color="$textSecondary">
                {"•"}
              </Text>
              <Text variant="body" flex={1}>
                {t(`terms.gate.summary.${key}`)}
              </Text>
            </XStack>
          ))}
          <Text variant="caption">{t("terms.gate.bindingLanguage")}</Text>
        </YStack>

        <YStack gap={10}>
          <DocumentLink
            label={t("terms.gate.readTerms")}
            onPress={() => void openDocument(termsUrlOf(terms))}
          />
          <DocumentLink
            label={t("terms.gate.readPrivacy")}
            onPress={() => void openDocument(privacyUrlOf(terms))}
          />
        </YStack>

        {/* One checkbox, and only for the Terms. A privacy policy is not
            agreed to — it is disclosed — and putting both behind one tick
            would merge two different legal bases into one ambiguous act. */}
        <Pressable
          onPress={() => setAgreed((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          hitSlop={8}
        >
          <XStack gap={12} ai="center">
            <YStack
              width={24}
              height={24}
              borderRadius={6}
              ai="center"
              jc="center"
              borderWidth={agreed ? 0 : 1.5}
              borderColor="$borderToken"
              backgroundColor={agreed ? "$accent" : "transparent"}
            >
              {agreed ? <Check size={16} color="#FFFFFF" /> : null}
            </YStack>
            <Text variant="body" flex={1}>
              {t("terms.gate.checkbox")}
            </Text>
          </XStack>
        </Pressable>

        <Text variant="caption">{t("terms.gate.privacyNotice")}</Text>

        {error ? (
          <Text variant="bodySm" color="$danger">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <YStack
        paddingHorizontal={20}
        paddingBottom={insets.bottom + 16}
        paddingTop={8}
        gap={12}
      >
        <Button
          variant={agreed ? "primary" : "primaryDisabled"}
          size="lg"
          fullWidth
          disabled={!agreed || isLoading || !terms}
          loading={isLoading}
          onPress={() => void handleAccept()}
        >
          {t("terms.gate.accept")}
        </Button>
        <Button variant="ghost" size="md" fullWidth onPress={handleSignOut}>
          {t("terms.gate.decideLater")}
        </Button>
      </YStack>
    </YStack>
  );
}

function DocumentLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text variant="body" style={{ color: colors.accent }}>
        {label}
      </Text>
    </Pressable>
  );
}
