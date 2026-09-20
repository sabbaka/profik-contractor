import {
  OPEN_JOBS_PAGE_SIZE,
  useGetOpenJobsInfiniteQuery,
} from "@/src/api/profikApi";
import { Button, Text, TextInput } from "@/src/components/ui/ui";
import { useTabBarVisibility } from "@/src/context/TabBarVisibilityContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useThemeColors, useThemeMode } from "@/src/theme";
import { Slider } from "@tamagui/slider";
import { Calendar, LocateFixed } from "@tamagui/lucide-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  InputAccessoryView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, XStack, YStack } from "tamagui";
import { useDeviceLocation } from "./hooks/useDeviceLocation";
import {
  buildOpenJobsParams,
  countActiveFilterGroups,
  DEFAULT_RADIUS_KM,
  EMPTY_OPEN_JOBS_FILTERS,
  RADIUS_SLIDER_MAX,
  type OpenJobsFilterDraft,
} from "./hooks/useOpenJobsFilters";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A numeric keyboard has no return key to dismiss it with, and the only other
// way out of it here — tapping a blank patch of the sheet — is mostly covered
// by the keyboard itself. iOS-only: `InputAccessoryView` renders nothing on
// Android, which has a system back gesture for this.
const PRICE_ACCESSORY_ID = "openJobsPriceAccessory";

interface OpenJobsFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: OpenJobsFilterDraft;
  appliedCoords: { lat: number; lng: number } | null;
  onApply: (
    draft: OpenJobsFilterDraft,
    coords: { lat: number; lng: number } | null,
  ) => void;
}

/**
 * The Open Jobs filter sheet: price range, cleaning date range, and a
 * GPS-only location radius — the three filters `GET /jobs/open` accepts
 * today (see docs/open-jobs-filters-backend.md). Time slot and manual
 * location entry are deliberately out of scope, not an oversight.
 *
 * Owns its own draft state, seeded from `applied`/`appliedCoords` whenever it
 * opens, and only hands the draft back via `onApply` — the list underneath
 * never sees a half-edited filter while this is open. The "Show N Jobs"
 * button previews the *actual* result count via a debounced, separately
 * cached call to the same query the list itself uses — RTK Query dedups it
 * against the list's own cache entry once the draft matches what's applied.
 */
export function OpenJobsFiltersSheet({
  open,
  onOpenChange,
  applied,
  appliedCoords,
  onApply,
}: OpenJobsFiltersSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { mode } = useThemeMode();
  const location = useDeviceLocation();
  const insets = useSafeAreaInsets();
  const { hideTabBar, showTabBar } = useTabBarVisibility();

  // Being non-modal (see the `Sheet` below) is what makes this necessary —
  // this sheet paints inside the Open tab's own screen content, below the
  // TabBar the tab navigator renders as its own overlay, so without this the
  // bar stays visible in front of (or straight through) the sheet the whole
  // time it's open. Effect, not a render-time call: `hideTabBar`/
  // `showTabBar` update state on a *different* component (the tab layout),
  // which a render is not allowed to do to anything but its own.
  useEffect(() => {
    if (!open) return;
    hideTabBar();
    return () => showTabBar();
  }, [open, hideTabBar, showTabBar]);

  const [draft, setDraft] = useState(applied);
  const [activeDateField, setActiveDateField] = useState<"from" | "to" | null>(
    null,
  );
  const coords = location.coords ?? appliedCoords;

  // Drives the date-picker Modal's open/close transition as one number
  // (0 = hidden, 1 = shown) instead of the Modal's own built-in
  // `animationType`, which slides its *entire* content — backdrop included —
  // as a single unit. A backdrop that fades while the panel slides is the
  // conventional bottom-sheet feel; getting that needs the two driven
  // separately, hence rolling it by hand.
  const [pickerVisible, setPickerVisible] = useState(false);
  // A plain (never-set) `useState` rather than `useRef(...).current` — the
  // lint rule that flags reading a ref's value during render (`react-hooks/
  // refs`) doesn't know `Animated.Value` mutates outside React's render
  // cycle on purpose; `useState` gives the same "create once, stable
  // identity forever" without tripping it.
  const [pickerProgress] = useState(() => new Animated.Value(0));

  const openDateField = (field: "from" | "to") => {
    // The picker is a native `Modal`, which on iOS is its own window — a
    // keyboard left up by the price fields outlives it and floats over the
    // panel's own Done row. The date fields swallow the tap that would
    // otherwise reach `Keyboard.dismiss` below, so nothing else closes it.
    Keyboard.dismiss();
    setActiveDateField(field);
    setPickerVisible(true);
    pickerProgress.setValue(0);
    Animated.timing(pickerProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDateField = () => {
    Animated.timing(pickerProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setPickerVisible(false);
      setActiveDateField(null);
    });
  };

  // Re-seeds the draft from what's applied every time the sheet opens —
  // adjusted during render rather than in an effect (the sanctioned pattern
  // for "reset state when a prop changes", see the React docs on effects) so
  // reopening never flashes the previous session's stale edits for a frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    // The date-picker Modal lives outside the Sheet (see below) and reads
    // its own `visible` off `pickerVisible`, so closing the sheet without
    // this would leave it floating on screen with nothing left to close it.
    // A hard reset, not `closeDateField()` — the whole sheet is on its way
    // out, so there is nothing left to animate.
    setActiveDateField(null);
    setPickerVisible(false);
    pickerProgress.setValue(0);
    if (open) {
      setDraft(applied);
    }
  }

  const debouncedParams = useDebouncedValue(
    buildOpenJobsParams(draft, coords),
    400,
  );
  const { data: previewData, isFetching: isPreviewFetching } =
    useGetOpenJobsInfiniteQuery(debouncedParams, { skip: !open });
  const previewCount = previewData?.pages.flat().length;
  const previewHasMore = previewData
    ? previewData.pages.at(-1)?.length === OPEN_JOBS_PAGE_SIZE
    : false;

  const handleEnableLocation = async () => {
    const next = await location.request();
    if (next && draft.radiusKm == null) {
      setDraft((d) => ({ ...d, radiusKm: DEFAULT_RADIUS_KM }));
    }
  };

  // Not `debouncedParams` — "Clear All" enabling should track every
  // keystroke immediately, not wait out the preview-count debounce.
  const draftHasFilters =
    countActiveFilterGroups(buildOpenJobsParams(draft, coords)) > 0;

  const handleClearAll = () => {
    if (!draftHasFilters) return;
    setDraft(EMPTY_OPEN_JOBS_FILTERS);
    if (activeDateField) closeDateField();
  };

  const handleShow = () => {
    onApply(draft, draft.radiusKm != null ? coords : null);
    onOpenChange(false);
  };

  const radiusLabel =
    draft.radiusKm == null
      ? null
      : draft.radiusKm >= RADIUS_SLIDER_MAX
        ? t("open.filters.withinKmPlus", { count: RADIUS_SLIDER_MAX })
        : t("open.filters.withinKm", { count: draft.radiusKm });

  const showJobsLabel =
    previewData == null
      ? t("open.filters.showJobsLoading")
      : previewHasMore
        ? t("open.filters.showJobsMore", { count: previewCount })
        : t("open.filters.showJobs", { count: previewCount });

  return (
    <>
      <Sheet
        // `modal={false}`, matching ReviewSheet/NamePromptSheet/
        // AppFeedbackSheet/CountryPickerSheet. It was `modal` for a while,
        // to paint above the Open tab's persistent TabBar (rendered by the
        // tab navigator itself, outside this component's tree — a
        // non-modal Sheet paints inline, in this component's own stacking
        // context, which sits *below* the navigator-level TabBar). That
        // trade-off is real and accepted here, not a settled non-issue:
        // `useTabBarVisibility` below hides the TabBar for as long as this
        // sheet is open specifically to cover for it.
        modal={false}
        unmountChildrenWhenHidden={false}
        open={open}
        onOpenChange={onOpenChange}
        // A fixed percentage — not `snapPointsMode="fit"` (opens full-screen
        // the first time; see the git history on this file for the
        // measurement race that causes it) and not a height computed from
        // `onLayout` either (tried, more than once; never held up against a
        // late-arriving `insets.bottom` or the `modal` swap above without
        // its own new failure mode). This is deliberately the boring,
        // unclever option: a little empty space under the button on a
        // short, unfiltered draft, permanently, rather than any more rounds
        // of "fit it to content" chasing a new edge case every time.
        snapPoints={[72]}
        dismissOnSnapToBottom
        zIndex={100_000}
        animation="medium"
        // Off, deliberately: at a fixed 78% height, sliding the whole frame
        // up by the keyboard's height on top of that can push its top edge
        // past the screen's own top (this is what "улетает" looked like
        // during this file's earlier fixed-height attempt, under
        // `modal={true}`). The two inputs that raise the keyboard here
        // (price min/max) sit at the very top of the content, so they're
        // never actually hidden behind it — nothing here needs this prop.
      >
        <Sheet.Overlay
          // Explicit, not Tamagui's own themed default — that default reads
          // visibly lighter than `ContractorHeader`'s own dim overlay (see
          // its comment on why it needs one at all, since this Sheet is
          // non-modal), leaving a hard seam right at the header's bottom
          // edge. Same literal in both places is what removes it.
          backgroundColor="rgba(0,0,0,0.5)"
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
          <Sheet.ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <YStack paddingHorizontal={20} gap={22}>
                <XStack alignItems="center" justifyContent="space-between">
                  <Text variant="h3">{t("open.filters.title")}</Text>
                  <Pressable
                    onPress={handleClearAll}
                    disabled={!draftHasFilters}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !draftHasFilters }}
                  >
                    <Text
                      variant="bodyStrong"
                      style={{
                        color: draftHasFilters
                          ? colors.accent
                          : colors.textMuted,
                      }}
                    >
                      {t("open.filters.clearAll")}
                    </Text>
                  </Pressable>
                </XStack>

                <YStack gap={10}>
                  <Text variant="sectionLabel">
                    {t("open.filters.priceRangeLabel")}
                  </Text>
                  <XStack gap={12}>
                    <YStack flex={1} gap={6}>
                      <Text variant="caption">
                        {t("open.filters.priceFrom")}
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        inputAccessoryViewID={PRICE_ACCESSORY_ID}
                        value={draft.priceMin}
                        onChangeText={(v) =>
                          setDraft((d) => ({ ...d, priceMin: v }))
                        }
                        placeholder="0"
                      />
                    </YStack>
                    <YStack flex={1} gap={6}>
                      <Text variant="caption">{t("open.filters.priceTo")}</Text>
                      <TextInput
                        keyboardType="numeric"
                        inputAccessoryViewID={PRICE_ACCESSORY_ID}
                        value={draft.priceMax}
                        onChangeText={(v) =>
                          setDraft((d) => ({ ...d, priceMax: v }))
                        }
                        placeholder="15000"
                      />
                    </YStack>
                  </XStack>
                </YStack>

                <YStack gap={10}>
                  <Text variant="sectionLabel">
                    {t("open.filters.dateLabel")}
                  </Text>
                  <XStack gap={12}>
                    <DateField
                      label={t("open.filters.dateFrom")}
                      value={draft.dateFrom}
                      active={activeDateField === "from"}
                      onPress={() =>
                        activeDateField === "from"
                          ? closeDateField()
                          : openDateField("from")
                      }
                    />
                    <DateField
                      label={t("open.filters.dateTo")}
                      value={draft.dateTo}
                      active={activeDateField === "to"}
                      onPress={() =>
                        activeDateField === "to"
                          ? closeDateField()
                          : openDateField("to")
                      }
                    />
                  </XStack>
                </YStack>

                <YStack gap={10}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text variant="sectionLabel">
                      {t("open.filters.locationLabel")}
                    </Text>
                    {radiusLabel && (
                      <YStack
                        paddingHorizontal={10}
                        paddingVertical={4}
                        borderRadius={9999}
                        backgroundColor={colors.accentLight}
                      >
                        <Text
                          variant="chip"
                          style={{ color: colors.accent, fontWeight: "600" }}
                        >
                          {radiusLabel}
                        </Text>
                      </YStack>
                    )}
                  </XStack>

                  {coords ? (
                    <Slider
                      min={1}
                      max={RADIUS_SLIDER_MAX}
                      step={1}
                      value={[draft.radiusKm ?? DEFAULT_RADIUS_KM]}
                      onValueChange={([v]) =>
                        setDraft((d) => ({ ...d, radiusKm: v }))
                      }
                      size="$3"
                    >
                      <Slider.Track backgroundColor={colors.borderSubtle}>
                        <Slider.TrackActive backgroundColor={colors.accent} />
                      </Slider.Track>
                      <Slider.Thumb
                        index={0}
                        circular
                        elevate
                        backgroundColor={colors.accent}
                        // Tamagui's Slider.Thumb ships a themed 2px border by
                        // default (`bordered: 2` in its own unstyled variant)
                        // — on this dark theme that reads as a stray grey
                        // ring around the dot. `elevate`'s shadow is enough
                        // depth on its own.
                        borderWidth={0}
                      />
                    </Slider>
                  ) : (
                    <YStack gap={8}>
                      {location.status === "denied" && (
                        <Text variant="caption">
                          {t("open.filters.locationDenied")}
                        </Text>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        loading={location.status === "requesting"}
                        onPress={handleEnableLocation}
                        iconLeft={
                          <LocateFixed size={16} color={colors.accent} />
                        }
                      >
                        {t("open.filters.locationEnable")}
                      </Button>
                    </YStack>
                  )}
                </YStack>

                <Button
                  variant="primary"
                  loading={isPreviewFetching && previewData == null}
                  onPress={handleShow}
                >
                  {showJobsLabel}
                </Button>
              </YStack>
            </TouchableWithoutFeedback>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>

      {/* The way out of the numeric keyboard. Without it the only exit is a
          tap on bare sheet, and the keyboard covers the bottom of the sheet
          — including the Show-jobs button — so there is often no bare sheet
          left to tap: the filters end up unreachable behind their own
          keyboard. Rendered outside the Sheet because iOS attaches it to the
          keyboard itself, not to whatever view declares it. */}
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={PRICE_ACCESSORY_ID}>
          <XStack
            justifyContent="flex-end"
            alignItems="center"
            paddingHorizontal={20}
            height={44}
            backgroundColor={colors.bgPrimary}
            borderTopWidth={1}
            borderTopColor={colors.borderSubtle}
          >
            <Pressable
              onPress={Keyboard.dismiss}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text variant="bodyStrong" style={{ color: colors.accent }}>
                {t("common.done")}
              </Text>
            </Pressable>
          </XStack>
        </InputAccessoryView>
      ) : null}

      {/* A separate native Modal, not part of the Sheet's own view tree — the
          iOS spinner is itself a continuously vertical-drag-responsive
          control, and every attempt at rendering it *inside* the sheet (in
          the scrollable content, then as an absolutely-positioned sibling of
          it) left it fighting the sheet's own pan-to-dismiss gesture for the
          same touch: sometimes the wheel spun to a garbage date, sometimes
          the sheet's gesture handler won outright and the wheel stopped
          responding at all. A Modal is a separate native window layer, so
          there is no shared gesture arbiter left to fight over. */}
      <Modal
        visible={pickerVisible}
        transparent
        // No built-in transition — the backdrop fade and panel slide below
        // are driven off the same `pickerProgress` value instead, so closing
        // reads as "the sheet slides down while the dimming lifts", not the
        // whole thing (backdrop included) sliding off as one flat block.
        animationType="none"
        onRequestClose={closeDateField}
      >
        <AnimatedPressable
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.4)",
            opacity: pickerProgress,
          }}
          onPress={closeDateField}
          accessibilityRole="button"
          accessibilityLabel={t("open.filters.dateDone")}
        >
          {/* Its own Pressable claims the touch responder for this region so
              a tap on the panel itself (or the picker) doesn't fall through
              to the backdrop above and close the modal underneath it. */}
          <Pressable onPress={() => {}}>
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: pickerProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [320, 0],
                    }),
                  },
                ],
              }}
            >
              <YStack
                backgroundColor={colors.bgPrimary}
                borderTopLeftRadius={24}
                borderTopRightRadius={24}
                paddingBottom={16}
              >
                <XStack
                  justifyContent="flex-end"
                  paddingHorizontal={20}
                  paddingTop={16}
                >
                  <Pressable
                    onPress={closeDateField}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text variant="bodyStrong" style={{ color: colors.accent }}>
                      {t("open.filters.dateDone")}
                    </Text>
                  </Pressable>
                </XStack>
                {activeDateField && (
                  <DateTimePicker
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    themeVariant={mode}
                    textColor={colors.textPrimary}
                    accentColor={colors.accent}
                    value={
                      (activeDateField === "from"
                        ? draft.dateFrom
                        : draft.dateTo) ?? new Date()
                    }
                    minimumDate={
                      activeDateField === "to"
                        ? (draft.dateFrom ?? undefined)
                        : undefined
                    }
                    maximumDate={
                      activeDateField === "from"
                        ? (draft.dateTo ?? undefined)
                        : undefined
                    }
                    onChange={(_event, selected) => {
                      if (Platform.OS === "android") closeDateField();
                      if (!selected) return;
                      setDraft((d) =>
                        activeDateField === "from"
                          ? { ...d, dateFrom: selected }
                          : { ...d, dateTo: selected },
                      );
                    }}
                  />
                )}
              </YStack>
            </Animated.View>
          </Pressable>
        </AnimatedPressable>
      </Modal>
    </>
  );
}

function DateField({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: Date | null;
  active: boolean;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const formatted = value
    ? value.toLocaleDateString(i18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : t("open.filters.datePlaceholder");

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1 }}>
      <YStack
        flex={1}
        gap={6}
        paddingHorizontal={16}
        paddingVertical={10}
        borderRadius={12}
        backgroundColor={colors.surfaceInput}
        borderWidth={active ? 1.5 : 0}
        borderColor={colors.accent}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Text variant="caption">{label}</Text>
          <Calendar size={14} color={colors.textMuted} />
        </XStack>
        <Text variant="bodyStrong" numberOfLines={1}>
          {formatted}
        </Text>
      </YStack>
    </Pressable>
  );
}
