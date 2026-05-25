import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useMemo } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IPOEventCard } from "@/components/IPOEventCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Region, REGION_COLORS, REGION_LABELS } from "@/constants/mockData";
import { useLiveIPOEvents, DataSource } from "@/hooks/useLiveIPOEvents";
import { useColors } from "@/hooks/useColors";

const REGIONS_ORDER: Region[] = [
  "NORTH_AMERICA",
  "EUROPE",
  "EAST_ASIA",
  "SOUTH_ASIA",
  "MIDDLE_EAST",
  "OCEANIA",
];

function LiveBadge({ dataSource, fetchedAt, onRefresh, colors }: {
  dataSource: DataSource;
  fetchedAt: string | null;
  onRefresh: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (dataSource === "live" || dataSource === "cached") {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [dataSource, pulse]);

  const timeAgo = fetchedAt
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
      })()
    : null;

  const pill = () => {
    switch (dataSource) {
      case "loading":
        return (
          <View style={[styles.livePill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="loader" size={10} color={colors.mutedForeground} />
            <Text style={[styles.livePillText, { color: colors.mutedForeground }]}>Fetching live data…</Text>
          </View>
        );
      case "live":
        return (
          <View style={[styles.livePill, { backgroundColor: "#16a34a18", borderColor: "#16a34a44" }]}>
            <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
            <Text style={[styles.livePillText, { color: "#16a34a" }]}>LIVE · Google Search</Text>
          </View>
        );
      case "cached":
        return (
          <View style={[styles.livePill, { backgroundColor: "#16a34a18", borderColor: "#16a34a44" }]}>
            <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
            <Text style={[styles.livePillText, { color: "#16a34a" }]}>LIVE · cached</Text>
          </View>
        );
      case "rate_limited":
        return (
          <View style={[styles.livePill, { backgroundColor: "#b4530818", borderColor: "#b4530844" }]}>
            <Feather name="clock" size={10} color="#b45308" />
            <Text style={[styles.livePillText, { color: "#b45308" }]}>Quota limit · sample data</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.livePill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="database" size={10} color={colors.mutedForeground} />
            <Text style={[styles.livePillText, { color: colors.mutedForeground }]}>Sample data</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.liveBadgeRow}>
      {pill()}
      {timeAgo && (dataSource === "live" || dataSource === "cached") && (
        <Text style={[styles.liveTime, { color: colors.mutedForeground }]}>
          Updated {timeAgo}
        </Text>
      )}
      <Pressable onPress={onRefresh} style={[styles.refreshBtn, { borderColor: colors.border }]}>
        <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, isLoading, isLive, isCached, dataSource, fetchedAt, totalRaised, refetch } = useLiveIPOEvents();

  const stats = useMemo(() => {
    const total = events.length;
    const priced = events.filter(
      (e) => e.eventType === "PRICING" || e.eventType === "DAY1_LISTING"
    ).length;
    return { total, priced, totalRaised };
  }, [events, totalRaised]);

  const regionCounts = useMemo(() => {
    const counts: Partial<Record<Region, number>> = {};
    for (const e of events) {
      counts[e.region] = (counts[e.region] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const hotDeals = useMemo(
    () =>
      events.filter(
        (e) =>
          e.eventType === "DAY1_LISTING" ||
          e.eventType === "PRICING" ||
          (e.eventType === "BOOK_BUILDING" && e.subscriptionOverall && e.subscriptionOverall > 5)
      ).slice(0, 5),
    [events]
  );

  const recentEvents = useMemo(() => events.slice(0, 6), [events]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            IPO Intelligence
          </Text>
          <Text style={[styles.headerDate, { color: colors.mutedForeground }]}>
            {today} · 48h Global Sweep
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/report")}
          style={[styles.reportBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="zap" size={14} color={colors.primaryForeground} />
          <Text style={[styles.reportBtnText, { color: colors.primaryForeground }]}>
            Report
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <LiveBadge
          dataSource={dataSource}
          fetchedAt={fetchedAt}
          onRefresh={refetch}
          colors={colors}
        />

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Events</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalRaised}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Capital Raised</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.priced}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Priced / Listed</Text>
          </View>
        </View>

        <SectionHeader title="Regional Activity" subtitle="Events in last 48h" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionRow}
        >
          {REGIONS_ORDER.map((region) => {
            const count = regionCounts[region] ?? 0;
            const color = REGION_COLORS[region];
            return (
              <Pressable
                key={region}
                onPress={() => router.push({ pathname: "/(tabs)/feed", params: { region } })}
                style={[styles.regionChip, { backgroundColor: color + "18", borderColor: color + "44" }]}
              >
                <View style={[styles.regionDot, { backgroundColor: color }]} />
                <View>
                  <Text style={[styles.regionLabel, { color: colors.foreground }]}>
                    {REGION_LABELS[region]}
                  </Text>
                  <Text style={[styles.regionCount, { color: color }]}>
                    {count} {count === 1 ? "event" : "events"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader title="Today's Headlines" subtitle="Pricings, listings & closings" />
        {hotDeals.length > 0 ? (
          <FlatList
            data={hotDeals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <IPOEventCard event={item} />}
            scrollEnabled={false}
          />
        ) : (
          <View style={[styles.emptySection, { borderColor: colors.border }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No pricings or listings in this window
            </Text>
          </View>
        )}

        <SectionHeader
          title="Full Activity Feed"
          right={
            <Pressable onPress={() => router.push("/(tabs)/feed")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </Pressable>
          }
        />
        {recentEvents.map((event) => (
          <IPOEventCard key={event.id} event={event} compact />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 16,
    gap: 4,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },
  livePillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  liveTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  refreshBtn: {
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: "auto",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  regionRow: {
    gap: 8,
    paddingBottom: 16,
  },
  regionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  regionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  regionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  regionCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  emptySection: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  emptySectionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
