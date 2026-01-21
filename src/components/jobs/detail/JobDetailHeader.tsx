import { ArrowLeft } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { Button, Text, XStack } from "tamagui";

export function JobDetailHeader() {
  return (
    <XStack paddingVertical="$2" paddingHorizontal="$3" alignItems="center">
      <Button
        icon={ArrowLeft}
        chromeless
        circular
        size="$2"
        scaleIcon={1.5}
        onPress={() => router.back()}
        color="$color"
      />
      <Text
        fontSize="$6"
        fontWeight="600"
        numberOfLines={1}
        flex={1}
        textAlign="center"
      >
        Details
      </Text>
    </XStack>
  );
}
