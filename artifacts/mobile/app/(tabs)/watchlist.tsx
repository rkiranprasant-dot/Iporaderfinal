import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IPOEventCard } from "@/components/IPOEventCard";
import { MOCK_IPO_EVENTS } from "@/constants/mockData";
import { useWatchlist } from "@/context/WatchlistContext";
import { useColors } from "@/hooks/useColors";

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { watchlist } = useWatchlist();
  const router = useRouter();

  const watchedEvents = useMemo(
    () => MOCK_IPO_EVENTS.filter((e) => watchlist.includes(e.id)),
    [watchlist]
  );

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  if (watchedEvents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="bookmark" size={32} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No watched deals
        </Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          Tap the bookmark icon on any IPO event to track it here.
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/feed")}
          style={[styles.browseBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.browseBtnText, { color: colors.primaryForeground }]}>
            Browse IPO Feed
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={watchedEvents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <IPOEventCard event={item} />}
      contentContainerStyle={[styles.list, { paddingBottom: bottomPadding, paddingTop: topPadding + 8 }]}
      ListHeaderComponent={
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {watchedEvents.length} {watchedEvents.length === 1 ? "deal" : "deals"} tracked
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 16,
    gap: 2,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
});
