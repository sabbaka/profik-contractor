import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Lets a screen ask the tab navigator to hide the TabBar while something of
 * its own is on screen — the Open Jobs filter sheet is the first user of
 * this, since it's non-modal (see `OpenJobsFiltersSheet.tsx`'s own comment on
 * why) and paints inside that screen's own stacking context, which sits
 * *below* the TabBar's. Rendered by `app/(contractor)/(tabs)/_layout.tsx`,
 * outside any single screen's own tree, so hiding has to be asked for rather
 * than just not rendering the bar locally.
 *
 * A ref-counted `hide`/`show` pair rather than a plain boolean setter: two
 * independent screens (or two overlapping opens of the same one) hiding it
 * at once must not let the first one's `show` reveal it while the second
 * still wants it hidden.
 */
interface TabBarVisibilityContextType {
  hidden: boolean;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TabBarVisibilityContext = createContext<
  TabBarVisibilityContextType | undefined
>(undefined);

export function TabBarVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hideCount, setHideCount] = useState(0);

  // Stable identities: consumers key an effect's cleanup off these (see
  // `OpenJobsFiltersSheet.tsx`), and a new function reference on every
  // render of this provider would re-run that effect on every unrelated
  // re-render up here, not just when the caller's own `open` state changes.
  const hideTabBar = useCallback(() => setHideCount((n) => n + 1), []);
  const showTabBar = useCallback(
    () => setHideCount((n) => Math.max(0, n - 1)),
    [],
  );

  const value = useMemo(
    () => ({ hidden: hideCount > 0, hideTabBar, showTabBar }),
    [hideCount, hideTabBar, showTabBar],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error(
      "useTabBarVisibility must be used within a TabBarVisibilityProvider",
    );
  }
  return context;
}
