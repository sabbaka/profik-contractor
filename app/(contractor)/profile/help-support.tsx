import { Button, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft, Mail } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

const SUPPORT_EMAIL = "sabbakaz@gmail.com";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <YStack gap={4}>
      <Text variant="bodyStrong">{question}</Text>
      <Text variant="body">{answer}</Text>
    </YStack>
  );
}

export default function HelpSupportScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleContactSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Profik Pro Support")}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through to the alert below
    }
    Alert.alert("", `Couldn't open your email app. Please email us at ${SUPPORT_EMAIL} instead.`);
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Back</Text>
          </XStack>
        </Pressable>
        <Text variant="h5">Help & Support</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24, gap: 24 }}>
        <Text variant="body">
          Need a hand with something? Here are answers to common questions, or you can reach us directly.
        </Text>

        <YStack gap={16}>
          <Text variant="sectionLabel">Frequently asked questions</Text>
          <FaqItem
            question="How do I find jobs?"
            answer="On the Open Jobs tab, browse jobs near you on the map and list. Tap a job to see its service type, property details, location, and the client's budget."
          />
          <FaqItem
            question="How do I send an offer?"
            answer="Open a job, tap Send Offer, set your price and an optional message, then submit. Track it in My Jobs under Pending / Accepted / Declined."
          />
          <FaqItem
            question="How do I message a client?"
            answer="Open your offer and tap into the Offer Chat to message the client directly — no need to share your phone number."
          />
          <FaqItem
            question="How do I add funds to my balance?"
            answer="Open Balance from your profile, enter an amount, and continue to the secure payment page. Your balance is used to pay platform fees."
          />
          <FaqItem
            question="How do I delete my account?"
            answer="Go to Account settings and scroll to Delete account. This permanently removes your account and cannot be undone."
          />
        </YStack>

        <YStack gap={10}>
          <Text variant="sectionLabel">Still need help?</Text>
          <Button variant="secondary" iconLeft={<Mail size={16} color="#6B7280" />} onPress={handleContactSupport}>
            Email Support
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
