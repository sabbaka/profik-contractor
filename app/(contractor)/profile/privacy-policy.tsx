import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

const SUPPORT_EMAIL = "sabbakaz@gmail.com";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <YStack gap={6}>
      <Text variant="h5">{title}</Text>
      <Text variant="body">{body}</Text>
    </YStack>
  );
}

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Back</Text>
          </XStack>
        </Pressable>
        <Text variant="h5">Privacy Policy</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24, gap: 20 }}>
        <Text variant="body">
          This policy explains what information Profik Pro collects and how it is used. Profik Pro is
          the contractor-side app of the Profik marketplace, which connects customers with cleaning
          professionals in the Czech Republic.
        </Text>

        <Section
          title="Information we collect"
          body="Account details you provide (name, email, phone number, password), the offers and messages you send to clients, and your balance top-up history."
        />
        <Section
          title="Location"
          body="While you are using the app, we use your device location to show open jobs near you on the map and how far each job is from your current position. Location is not tracked in the background."
        />
        <Section
          title="Notifications"
          body="We use your device's push notification token to alert you about new client messages and offer updates."
        />
        <Section
          title="Balance top-ups"
          body="Adding funds to your balance is completed in an external, secure Stripe checkout page opened in your browser — Profik Pro does not store your card details."
        />
        <Section
          title="How your information is shared"
          body="Clients can see your name, profile, and the offers you send on their jobs. Your phone number is never shared with clients — all communication happens through the in-app offer chat."
        />
        <Section
          title="Data retention & deletion"
          body="Your data is kept for as long as your account is active. You can permanently delete your account at any time from Account settings → Delete account; your past offers and messages are anonymized rather than removed, so job history for clients stays intact."
        />
        <Section title="Contact us" body={`If you have questions about this policy, contact us at ${SUPPORT_EMAIL}.`} />
      </ScrollView>
    </YStack>
  );
}
