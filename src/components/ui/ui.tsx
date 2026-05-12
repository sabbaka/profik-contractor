import { colors } from "@/src/theme";
import React, { useEffect } from "react";
import {
  Button as TamaguiButton,
  Card as TamaguiCard,
  Spinner as TamaguiSpinner,
  View as TamaguiView,
  Text as TextElement,
  Input,
  styled,
  YStack,
} from "tamagui";

export const Button = styled(TamaguiButton, {
  borderRadius: 9999,
  fontSize: 17,

  variants: {
    variant: {
      default: {
        height: "auto",
        backgroundColor: colors.accent,
        color: colors.textInverse,
        paddingVertical: "$4",
        pressStyle: {
          opacity: 0.9,
          scale: 0.97,
        },
      },

      primary: {
        height: "auto",
        backgroundColor: colors.accent,
        color: colors.textInverse,
        pressStyle: {
          backgroundColor: colors.accentGradientEnd,
          borderWidth: 0,
        },
        paddingVertical: "$4",
        fontSize: 17,
      },
      secondary: {
        height: "auto",
        backgroundColor: colors.bgCard,
        color: colors.textPrimary,
        paddingVertical: "$4",
      },
      bordered: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
      },
      borderedProminent: {
        backgroundColor: colors.accent,
        color: colors.textInverse,
        fontWeight: "600",
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 0,
        color: colors.textSecondary,
      },
      contained: {
        height: "auto",
        backgroundColor: colors.accent,
        color: colors.textInverse,
        paddingVertical: "$4",
        fontSize: 17,
        pressStyle: {
          backgroundColor: colors.accentGradientEnd,
          borderWidth: 0,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
  },
});

export const TextInput = styled(Input, {
  borderWidth: 0,
  paddingVertical: "$5",
  fontSize: 16,
  color: colors.textPrimary,
  backgroundColor: colors.surfaceInput,
  height: "auto",
  borderRadius: 12,
  placeholderTextColor: colors.textMuted,

  focusStyle: {
    color: colors.textPrimary,
    borderColor: colors.border,
    borderWidth: 1,
  },

  variants: {
    secure: {
      true: {
        secureTextEntry: true,
      },
    },
  },
});

export const Text = styled(TextElement, {
  color: colors.textPrimary,
  variants: {
    large: {
      true: {
        fontSize: 22,
        lineHeight: 24,
        fontWeight: "bold",
      },
    },
    variant: {
      titleLarge: {
        fontSize: 22,
        fontWeight: "bold",
      },
      titleMedium: {
        fontSize: 18,
        fontWeight: "600",
      },
      headlineSmall: {
        fontSize: 24,
        fontWeight: "bold",
      },
      bodyLarge: {
        fontSize: 16,
      },
      bodyMedium: {
        fontSize: 14,
      },
    },
    type: {
      default: {
        fontSize: 16,
        lineHeight: 24,
      },
      title: {
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
      },
      defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
      },
      subtitle: {
        fontSize: 20,
        fontWeight: "bold",
      },
      link: {
        lineHeight: 30,
        fontSize: 16,
        color: colors.accent,
      },
    },
  },
});

export const ThemedView = styled(TamaguiView, {
  backgroundColor: colors.bgPrimary,
});

export const ActivityIndicator = TamaguiSpinner;

export const Card = Object.assign(
  styled(TamaguiCard, {
    padding: "$4",
    borderRadius: "$6",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  }),
  {
    Title: ({ title, subtitle }: { title: string; subtitle?: string }) => (
      <YStack marginBottom="$2">
        <Text fontSize={16} fontWeight="700">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize={14} color={colors.textSecondary}>
            {subtitle}
          </Text>
        )}
      </YStack>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <YStack>{children}</YStack>
    ),
  }
);

export function Snackbar({
  visible,
  onDismiss,
  duration = 3000,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <YStack
      position="absolute"
      bottom="$4"
      left="$4"
      right="$4"
      backgroundColor={colors.bgCard}
      padding="$4"
      borderRadius="$4"
      elevation="$4"
      zIndex={9999}
      borderWidth={1}
      borderColor={colors.border}
    >
      <Text color={colors.textPrimary}>{children}</Text>
    </YStack>
  );
}
