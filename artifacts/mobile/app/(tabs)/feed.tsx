import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IPOEventCard } from "@/components/IPOEventCard";
import {
  EventType,
  Region,
  REGION_COLORS,
  REGION_LABELS,
  REGIONS,
  EVENT_TYPE_LABELS,
} from "@/constants/mockData";
import { useLiveIPOEvents } from "@/hooks/useLiveIPOEvents";
import { useColors } from "@/hooks/useColors";

const EVENT_FILTERS: { key: EventType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BOOK_BUILDING", label: "Book Building" },
  { key: "PRICING", label: "Pricing" },
  { key: "ALLOTMENT", label: "Allotment" },
  { key: "S1_FILED", label: "Filed" },
  { key: "SPAC", label: "SPAC" },
  { key: "DIRECT_LISTING", label: "Direct" },
  { key: "UPLISTING", label: "Uplisting" },
  { key: "RUMOR", label: "Rumor" },
];

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ region?: string }>();
  const { events, isLoading, isLive, isCached, dataSource, refetch } = useLiveIPOEvents();

  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">(
    (params.region as Region) ?? "ALL"
  );
  const [selectedEvent, setSelectedEvent] = useState<EventType | "ALL">("ALL");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedRegion !== "ALL" && e.region !== selectedRegion) return false;
      if (selectedEvent !== "ALL" && e.eventType !== selectedEvent) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.company.toLowerCase().includes(q) ||
          e.exchange.toLowerCase().includes(q) ||
          (e.ticker?.toLowerCase().includes(q) ?? false) ||
          e.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, selectedRegion, selectedEvent, search]);

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterBar, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <View style={styles.searchAndStatus}>
          <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search companies, exchanges..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={refetch}
            style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            {isLoading ? (
              <ActivityIndicator size={12} color={colors.mutedForeground} />
            ) : (
              <Feather name="refresh-cw" size={12} color={isLive ? "#16a34a" : colors.mutedForeground} />
            )}
          </Pressable>
        </View>

        {dataSource !== "loading" && (
          <View style={styles.liveRow}>
            {(dataSource === "live" || dataSource === "cached") ? (
              <View style={[styles.livePill, { backgroundColor: "#16a34a18", borderColor: "#16a34a44" }]}>
                <View style={[styles.liveDot, { backgroundColor: "#16a34a" }]} />
                <Text style={[styles.livePillText, { color: "#16a34a" }]}>
                  LIVE{dataSource === "cached" ? " · cached" : " · fresh"}
                </Text>
              </View>
            ) : dataSource === "rate_limited" ? (
              <View style={[styles.livePill, { backgroundColor: "#b4530818", borderColor: "#b4530844" }]}>
                <Feather name="clock" size={10} color="#b45308" />
                <Text style={[styles.livePillText, { color: "#b45308" }]}>Quota limit · tap ↻ to retry</Text>
              </View>
            ) : (
              <View style={[styles.livePill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="database" size={10} color={colors.mutedForeground} />
                <Text style={[styles.livePillText, { color: colors.mutedForeground }]}>Sample data</Text>
              </View>
            )}
            <Text style={[styles.liveCount, { color: colors.mutedForeground }]}>
              {events.length} upcoming{isLive ? " · Google Search" : " · sample"}
            </Text>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Pressable
            onPress={() => setSelectedRegion("ALL")}
            style={[
              styles.chip,
              {
                backgroundColor: selectedRegion === "ALL" ? colors.primary : colors.secondary,
                borderColor: selectedRegion === "ALL" ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selectedRegion === "ALL" ? colors.primaryForeground : colors.secondaryForeground }]}>
              All Regions
            </Text>
          </Pressable>
          {REGIONS.map((region) => {
            const active = selectedRegion === region;
            const rColor = REGION_COLORS[region];
            return (
              <Pressable
                key={region}
                onPress={() => setSelectedRegion(active ? "ALL" : region)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? rColor + "33" : colors.secondary,
                    borderColor: active ? rColor : colors.border,
                  },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: rColor }]} />
                <Text style={[styles.chipText, { color: active ? rColor : colors.secondaryForeground }]}>
                  {REGION_LABELS[region]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {EVENT_FILTERS.map(({ key, label }) => {
            const active = selectedEvent === key;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedEvent(key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary + "22" : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? colors.primary : colors.secondaryForeground }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IPOEventCard event={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
            {isLive ? " · live" : " · sample"}
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Fetching upcoming IPOs…
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No upcoming IPOs match your filters
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 8,
  },
  searchAndStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  livePillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  liveCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 16,
    gap: 2,
  },
  resultCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
