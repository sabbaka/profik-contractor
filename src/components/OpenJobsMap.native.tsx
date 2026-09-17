import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useGetOpenJobsInfiniteQuery } from "../api/profikApi";
import { formatCategory, formatWorkName } from "../utils/jobWorkName";

export default function OpenJobsMapNative() {
  const { t } = useTranslation();
  // Only the pages the Open tab happens to have loaded. Acceptable while this
  // screen is unreachable; a real map wants every job in the viewport, which
  // is a bbox query, not a scroll-driven page chain.
  const { data } = useGetOpenJobsInfiniteQuery(
    {},
    {
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    },
  );

  const jobs = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  const coords = useMemo(
    () =>
      jobs.filter(
        (j) => typeof j.lat === "number" && typeof j.lng === "number",
      ),
    [jobs],
  );

  const region = useMemo(() => {
    if (coords.length > 0) {
      const latAvg =
        coords.reduce((s, j) => s + (j.lat as number), 0) / coords.length;
      const lngAvg =
        coords.reduce((s, j) => s + (j.lng as number), 0) / coords.length;
      return {
        latitude: latAvg,
        longitude: lngAvg,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
    }
    return {
      latitude: 50.0755,
      longitude: 14.4378,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  }, [coords]);

  return (
    <MapView style={styles.map} initialRegion={region}>
      {coords.map((j: any) => (
        <Marker
          key={j.id}
          coordinate={{ latitude: j.lat as number, longitude: j.lng as number }}
          title={formatWorkName(j, t)}
          description={formatCategory(j.category, t)}
          onCalloutPress={() =>
            router.push({
              pathname: "/(contractor)/jobs/[id]",
              params: { id: j.id },
            })
          }
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
