import {
  OPEN_JOBS_PAGE_SIZE,
  useGetOpenJobsInfiniteQuery,
} from "@/src/api/profikApi";
import { Button, Text, TextInput } from "@/src/components/ui/ui";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useThemeColors, useThemeMode } from "@/src/theme";
import { Slider } from "@tamagui/slider";
import { Calendar, LocateFixed } from "@tamagui/lucide-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
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
  const windowHeight = useWindowDimensions().height;

  // `snapPointsMode="fit"` sizes the frame to its actual content, but
  // Tamagui's Sheet resolves the very first open's target position before it
  // has measured the frame at all — its internal Y-position calc treats an
  // unmeasured (zero) frame height as "fully expanded", so the sheet opens
  // covering the whole screen the first time and only sizes correctly from
  // the second open onward, once a real measurement exists. Percent-mode
  // snap points don't depend on that measurement at all, so this computes
  // the equivalent percentage from the content's own measured height
  // instead — same auto-fit result, without the race. 78 matches this
  // sheet's very first (percent-based) height, before "fit" was tried, as
  // the fallback for the handful of frames before the first onLayout fires.
  const [snapPercent, setSnapPercent] = useState(78);

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
        // `modal`, unlike ReviewSheet/NamePromptSheet: this is the only sheet
        // opened from a *tab* screen, where a persistent bottom TabBar is
        // rendered by the tab navigator itself, outside this component's own
        // tree — a non-modal Sheet stays inside that tree and painted *under*
        // the tab bar for any content tall enough to reach it, which is what
        // this one is. A modal Sheet portals to the app root (above
        // `PortalProvider` in app/_layout.tsx), which sits above the tab bar
        // too. `unmountChildrenWhenHidden={false}` keeps this consistent with
        // the non-modal sheets: the draft and the granted GPS location survive
        // closing and reopening within the same screen visit.
        modal
        unmountChildrenWhenHidden={false}
        open={open}
        onOpenChange={onOpenChange}
        // Computed from the content's own measured height (see
        // `snapPercent` above) rather than "fit" mode — a short, unfiltered
        // draft still doesn't leave a slab of empty sheet below the "Show
        // Jobs" button, just without "fit"'s first-open bug.
        snapPoints={[snapPercent]}
        dismissOnSnapToBottom
        zIndex={100_000}
        animation="medium"
        moveOnKeyboardChange
      >
        <Sheet.Overlay
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
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <YStack
                paddingHorizontal={20}
                gap={22}
                onLayout={(e) => {
                  // The drag handle above (~20px) and the ScrollView's own
                  // bottom padding (32px) sit outside this YStack, so a fixed
                  // buffer covers them plus a comfortable margin — no
                  // measurement of those is needed since they don't change.
                  const contentHeight = e.nativeEvent.layout.height;
                  const percent = ((contentHeight + 90) / windowHeight) * 100;
                  setSnapPercent(
                    Math.min(92, Math.max(40, Math.round(percent))),
                  );
                }}
              >
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
