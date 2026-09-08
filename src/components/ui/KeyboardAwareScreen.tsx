import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type KeyboardAwareScreenProps = KeyboardAwareScrollViewProps;
/** Extends `ScrollView`, so `scrollTo` / `scrollToEnd` work as they always did. */
export type KeyboardAwareScreenRef = KeyboardAwareScrollViewRef;

/**
 * The scrolling body of any screen that holds a text input. Wraps
 * `KeyboardAwareScrollView` to settle the four conventions the screens here
 * kept drifting on — tap handling, drag-to-dismiss, the scroll indicator, and
 * the bottom safe-area inset — so a form screen is one component rather than a
 * `KeyboardAvoidingView` / `ScrollView` / `TouchableWithoutFeedback` stack
 * assembled slightly differently each time.
 *
 * Only the bottom inset is handled here. The header and `insets.top` stay with
 * the screen, which is what keeps this usable under the app's several
 * different header shapes.
 *
 * `mode` is the one decision the caller still has to make:
 *   - `"insets"` (default) extends the scrollable area without reflowing
 *     content — right when something below must hold still, like the map on
 *     the wizard's address step.
 *   - `"layout"` appends a real spacer, so `flexGrow: 1` spacers and
 *     `justifyContent: "center"` rearrange around the keyboard. Screens that
 *     push a button to the bottom need this; in `"insets"` mode they do not
 *     move at all.
 *
 * Never wrap this in `React.memo`. Tamagui distributes the theme by
 * subscription, and memoizing a component that renders `children` opaquely is
 * how leaf nodes end up frozen on the old palette after an appearance switch —
 * the same class of bug that keeps `reactCompiler` off in `app.config.ts`.
 */
export const KeyboardAwareScreen = forwardRef<
  KeyboardAwareScrollViewRef,
  KeyboardAwareScreenProps
>(function KeyboardAwareScreen(
  { bottomOffset = 24, contentContainerStyle, ...props },
  ref,
) {
  const insets = useSafeAreaInsets();
  const content = StyleSheet.flatten(contentContainerStyle) ?? {};

  return (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      {...props}
      contentContainerStyle={[
        content,
        {
          paddingBottom:
            ((content.paddingBottom as number) ?? 0) + insets.bottom,
        },
      ]}
    />
  );
});
