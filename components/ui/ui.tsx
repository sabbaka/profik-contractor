import { Input, styled, Button as TamaguiButton, Text as TextElement } from 'tamagui';

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
        backgroundColor: '$blue10',
        color: 'white',
        fontWeight: '600',
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 0,
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
  },
});
