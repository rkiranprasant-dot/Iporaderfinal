import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { useWatchlist } from "@/context/WatchlistContext";
import { useColors } from "@/hooks/useColors";
import { findEventById } from "@/lib/eventsStore";
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
} from "@/lib/notifications";

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { watchlist } = useWatchlist();
  const router = useRouter();
  const [notifStatus, setNotifStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useEffect(() => {
    getNotificationPermissionStatus()
      .then((s) => setNotifStatus(s as "granted" | "denied" | "undetermined"))
      .catch(() => {});
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermissions();
    setNotifStatus(granted ? "granted" : "denied");
  };

  const watchedEvents = useMemo(
    () =>
      watchlist
        .map((id) => findEventById(id))
        .filter((e): e is NonNullable<typeof e> => e != null),
    [watchlist]
  );

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  const notifBanner = () => {
    if (Platform.OS === "web") return null;
    if (notifStatus === "granted") {
      return (
        <View style={[styles.notifBanner, { backgroundColor: "#16a34a14", borderColor: "#16a34a33" }]}>
          <Feather name="bell" size={13} color="#16a34a" />
          <Text style={[styles.notifBannerText, { color: "#16a34a" }]}>
            Status alerts active — you'll be notified when any tracked deal changes stage
          </Text>
        </View>
      );
    }
    if (notifStatus === "denied") {
      return (
        <View style={[styles.notifBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="bell-off" size={13} color={colors.mutedForeground} />
          <Text style={[styles.notifBannerText, { color: colors.mutedForeground }]}>
            Notifications blocked — enable in device settings to receive IPO alerts
          </Text>
        </View>
      );
    }
    return (
      <Pressable
        onPress={handleEnableNotifications}
        style={[styles.notifBanner, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "44" }]}
      >
        <Feather name="bell" size={13} color={colors.primary} />
        <Text style={[styles.notifBannerText, { color: colors.primary }]}>
          Tap to enable status alerts for tracked deals
        </Text>
        <Feather name="chevron-right" size={13} color={colors.primary} />
      </Pressable>
    );
  };

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
          Tap the bookmark icon on any IPO event to track it here and receive status change alerts.
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/feed")}
          style={[styles.browseBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.browseBtnText, { color: colors.primaryForeground }]}>
            Browse Pipeline
          </Text>
        </Pressable>
        {Platform.OS !== "web" && notifStatus === "undetermined" && (
          <Pressable
            onPress={handleEnableNotifications}
            style={[styles.notifBtn, { borderColor: colors.border }]}
          >
            <Feather name="bell" size={14} color={colors.mutedForeground} />
            <Text style={[styles.notifBtnText, { color: colors.mutedForeground }]}>
              Enable IPO alerts
            </Text>
          </Pressable>
        )}
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
        <View style={styles.listHeader}>
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {watchedEvents.length} {watchedEvents.length === 1 ? "deal" : "deals"} tracked
          </Text>
          {notifBanner()}
        </View>
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
  notifBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  notifBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 16,
    gap: 2,
  },
  listHeader: {
    gap: 10,
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  notifBannerText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 17,
  },
});
