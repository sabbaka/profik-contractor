import { colors } from "@/src/theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGetOpenJobsQuery } from "../api/profikApi";

export default function OpenJobsMapWeb() {
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
        <Text style={{ marginBottom: 8, color: colors.textPrimary }}>Failed to load open jobs</Text>
        <TouchableOpacity onPress={refetch as any} style={styles.retryBtn}>
          <Text style={{ color: colors.textPrimary }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 8, color: colors.textSecondary }}>Map preview not available on web.</Text>
      {(jobs || []).map((j: any) => (
        <TouchableOpacity
          key={j.id}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/(contractor)/jobs/[id]",
              params: { id: j.id },
            })
          }
        >
          <Text style={styles.title}>{j.title}</Text>
          <Text style={styles.muted}>
            {j.category}
          </Text>
          <Text style={{ color: colors.textSecondary }} numberOfLines={2}>{j.description}</Text>
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
    backgroundColor: colors.bgPrimary,
  },
  container: { flex: 1, padding: 16, backgroundColor: colors.bgPrimary },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.bgCard,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
  },
  title: { fontWeight: "600", color: colors.textPrimary },
  muted: { marginBottom: 4, color: colors.textSecondary },
});
