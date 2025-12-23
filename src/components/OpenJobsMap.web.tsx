import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "tamagui";
import { useGetOpenJobsQuery } from "../api/profikApi";

export default function OpenJobsMapWeb() {
  const theme = useTheme();
  const {
    data: jobs,
    error,
    refetch,
  } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8 }}>❌ Failed to load open jobs</Text>
        <TouchableOpacity onPress={refetch as any} style={styles.retryBtn}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 8 }}>Map preview not available on web.</Text>
      {(jobs || []).map((j: any) => (
        <TouchableOpacity
          key={j.id}
          style={[
            styles.card,
            {
              backgroundColor: theme?.background?.val ?? "#fff",
              borderColor: theme?.gray4?.val ?? "#eee",
            },
          ]}
          onPress={() =>
            router.push({
              pathname: "/(contractor)/jobs/[id]",
              params: { id: j.id },
            })
          }
        >
          <Text style={styles.title}>{j.title}</Text>
          <Text style={[styles.muted, { color: theme?.gray10?.val ?? "#666" }]}>
            {j.category}
          </Text>
          <Text numberOfLines={2}>{j.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  container: { flex: 1, padding: 16 },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  card: { padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
  title: { fontWeight: "600" },
  muted: { marginBottom: 4 },
});
