import i18n from "@/src/i18n";
import { logError } from "@/src/utils/logger";
import { AlertTriangle } from "@tamagui/lucide-icons";
import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";
import { Button, Text } from "./ui";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Optional custom fallback. Receives the captured error and a `reset`
   * function that re-mounts the children subtree.
   */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Tag used in logs (e.g. "wizard", "profile") so we know where it crashed. */
  context?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches **render-time** errors anywhere in the React subtree and replaces
 * the broken UI with a friendly retry screen instead of a black screen.
 *
 * Async errors (event handlers, timers, promises) are NOT caught here — those
 * are handled by `setupGlobalErrorHandlers()` in `app/_layout.tsx`.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, `boundary:${this.props.context ?? "root"}`, {
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultFallback error={error} onReset={this.reset} />;
  }
}

function DefaultFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <YStack flex={1} backgroundColor="$bgPrimary">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          gap: 24,
        }}
      >
        <YStack ai="center" gap={20}>
          <YStack
            width={72}
            height={72}
            borderRadius={20}
            ai="center"
            jc="center"
            backgroundColor="$dangerBg"
          >
            <AlertTriangle size={32} color={theme.danger?.val} />
          </YStack>
          <YStack ai="center" gap={8}>
            <Text variant="display" textAlign="center">
              {i18n.t("errorBoundary.title")}
            </Text>
            <Text variant="body" textAlign="center" style={{ maxWidth: 320 }}>
              {i18n.t("errorBoundary.body")}
            </Text>
          </YStack>
        </YStack>

        {__DEV__ ? (
          <YStack
            backgroundColor="$bgSecondary"
            padding={16}
            borderRadius={12}
            gap={6}
          >
            <Text variant="sectionLabel">Dev info</Text>
            <Text
              variant="caption"
              style={{ fontFamily: "GeistMono_500Medium" }}
            >
              {error.message}
            </Text>
            {error.stack ? (
              <Text
                variant="caption"
                style={{
                  fontFamily: "GeistMono_500Medium",
                  fontSize: 11,
                  lineHeight: 15,
                }}
              >
                {error.stack.split("\n").slice(0, 8).join("\n")}
              </Text>
            ) : null}
          </YStack>
        ) : null}

        <YStack flex={1} />

        <Button variant="primary" onPress={onReset}>
          {i18n.t("errorBoundary.tryAgain")}
        </Button>
      </ScrollView>
    </YStack>
  );
}

export default ErrorBoundary;
