import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
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
import {
  MOCK_IPO_EVENTS,
  Region,
  REGION_COLORS,
  REGION_LABELS,
} from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

const REGIONS_ORDER: Region[] = [
  "NORTH_AMERICA",
  "EUROPE",
  "EAST_ASIA",
  "SOUTH_ASIA",
  "MIDDLE_EAST",
  "OCEANIA",
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const stats = useMemo(() => {
    const total = MOCK_IPO_EVENTS.length;
    const priced = MOCK_IPO_EVENTS.filter(
      (e) => e.eventType === "PRICING" || e.eventType === "DAY1_LISTING"
    ).length;
    const totalRaised = "$16.4B";
    return { total, priced, totalRaised };
  }, []);

  const regionCounts = useMemo(() => {
    const counts: Partial<Record<Region, number>> = {};
    for (const e of MOCK_IPO_EVENTS) {
      counts[e.region] = (counts[e.region] ?? 0) + 1;
    }
    return counts;
  }, []);

  const hotDeals = useMemo(
    () =>
      MOCK_IPO_EVENTS.filter(
        (e) =>
          e.eventType === "DAY1_LISTING" ||
          e.eventType === "PRICING" ||
          (e.eventType === "BOOK_BUILDING" && e.subscriptionOverall && e.subscriptionOverall > 5)
      ).slice(0, 5),
    []
  );

  const recentEvents = useMemo(() => MOCK_IPO_EVENTS.slice(0, 6), []);

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
        <FlatList
          data={hotDeals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <IPOEventCard event={item} />}
          scrollEnabled={false}
        />

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
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
