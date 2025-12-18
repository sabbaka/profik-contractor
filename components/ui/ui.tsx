import { Input, styled, Button as TamaguiButton, Text as TextElement, Card as TamaguiCard, View as TamaguiView } from 'tamagui';
import React, { useEffect, useState } from 'react';
import { YStack, XStack, Spinner as TamaguiSpinner } from 'tamagui';

export const Button = styled(TamaguiButton, {
  borderRadius: 10,
  fontSize: 17,

  variants: {
    variant: {
      default: {
        height: 'auto',
        backgroundColor: '$gray12',
        color: 'white',
        paddingVertical: '$4',
        pressStyle: {
          opacity: 0.9,
          scale: 0.97,
        },
      },

      primary: {
        height: 'auto',
        backgroundColor: '#fa2a48',
        color: 'white',
        pressStyle: {
          backgroundColor: '#e2223d',
          borderWidth: 0,
        },
        paddingVertical: '$4',
        fontSize: 17,
      },
      secondary: {
        height: 'auto',
        backgroundColor: '#181818',
        color: 'white',
        paddingVertical: '$4',
      },
      bordered: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fa2a48',
        color: '#fa2a48',
      },
      borderedProminent: {
        backgroundColor: '#fa2a48',
        color: 'white',
        fontWeight: '600',
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      contained: {
        height: 'auto',
        backgroundColor: '#fa2a48',
        color: 'white',
        paddingVertical: '$4',
        fontSize: 17,
        pressStyle: {
          backgroundColor: '#e2223d',
          borderWidth: 0,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

export const TextInput = styled(Input, {
  borderWidth: 0,
  paddingVertical: '$5',
  fontSize: 16,
  color: '$gray12',
  height: 'auto',
  borderRadius: 10,

  focusStyle: {
    color: '$gray12',
    borderColor: '$gray10',
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
  color: '$gray12',
  variants: {
    large: {
      true: {
        fontSize: 22,
        lineHeight: 24,
        fontWeight: 'bold',
      },
    },
    variant: {
      titleLarge: {
        fontSize: 22,
        fontWeight: 'bold',
      },
      titleMedium: {
        fontSize: 18,
        fontWeight: '600',
      },
      headlineSmall: {
        fontSize: 24,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        lineHeight: 32,
      },
      defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
      },
      subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
      },
      link: {
        lineHeight: 30,
        fontSize: 16,
        color: '#fa2a48',
      },
    },
  },
});

// ThemedView replacement - just use YStack or XStack with backgroundColor
export const ThemedView = styled(TamaguiView, {
  backgroundColor: '$background',
});

// ActivityIndicator replacement
export const ActivityIndicator = TamaguiSpinner;

// Card component
export const Card = Object.assign(
  styled(TamaguiCard, {
    padding: '$4',
    borderRadius: '$6',
    borderWidth: 1,
    borderColor: '$borderColor',
    backgroundColor: '$background',
  }),
  {
    Title: ({ title, subtitle }: { title: string; subtitle?: string }) => (
      <YStack marginBottom="$2">
        <Text fontSize={16} fontWeight="700">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize={14} color="$gray10">
            {subtitle}
          </Text>
        )}
      </YStack>
    ),
    Content: ({ children }: { children: React.ReactNode }) => <YStack>{children}</YStack>,
  }
);

// Snackbar/Toast component
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
      backgroundColor="$gray12"
      padding="$4"
      borderRadius="$4"
      elevation="$4"
      zIndex={9999}
    >
      <Text color="white">{children}</Text>
    </YStack>
  );
}
