import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  IPOEvent,
  REGION_COLORS,
  REGION_LABELS,
} from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { useWatchlist } from "@/context/WatchlistContext";

interface IPOEventCardProps {
  event: IPOEvent;
  compact?: boolean;
}

export function IPOEventCard({ event, compact = false }: IPOEventCardProps) {
  const colors = useColors();
  const { isWatched, toggleWatch } = useWatchlist();
  const router = useRouter();
  const watched = isWatched(event.id);

  const eventColor = EVENT_TYPE_COLORS[event.eventType];
  const regionColor = REGION_COLORS[event.region];

  const primaryMetric = () => {
    if (event.eventType === "DAY1_LISTING" && event.day1Performance != null) {
      const sign = event.day1Performance >= 0 ? "+" : "";
      return {
        label: "Day 1",
        value: `${sign}${event.day1Performance.toFixed(1)}%`,
        color: event.day1Performance >= 0 ? colors.success : colors.destructive,
      };
    }
    if (event.subscriptionOverall != null) {
      return {
        label: "Sub",
        value: `${event.subscriptionOverall.toFixed(2)}x`,
        color: colors.primary,
      };
    }
    if (event.raiseAmountUSD) {
      return {
        label: "Raise",
        value: event.raiseAmountUSD,
        color: colors.foreground,
      };
    }
    if (event.postMoneyValuation) {
      return {
        label: "Val",
        value: event.postMoneyValuation,
        color: colors.foreground,
      };
    }
    return null;
  };

  const metric = primaryMetric();

  return (
    <Pressable
      onPress={() => router.push(`/ipo/${event.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.eventBadge, { backgroundColor: eventColor + "22", borderColor: eventColor + "55" }]}>
            <Text style={[styles.eventBadgeText, { color: eventColor }]}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </Text>
          </View>
          <View style={[styles.regionDot, { backgroundColor: regionColor }]} />
          <Text style={[styles.regionText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {REGION_LABELS[event.region]}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleWatch(event.id);
          }}
          hitSlop={12}
        >
          <Feather
            name="bookmark"
            size={16}
            color={watched ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <View style={styles.midRow}>
        <View style={styles.midLeft}>
          <Text style={[styles.companyName, { color: colors.foreground }]} numberOfLines={1}>
            {event.company}
          </Text>
          <Text style={[styles.exchange, { color: colors.mutedForeground }]} numberOfLines={1}>
            {event.ticker ? `${event.ticker} · ` : ""}{event.exchange}
          </Text>
        </View>
        {metric && (
          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{metric.label}</Text>
            <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
          </View>
        )}
      </View>

      {!compact && (
        <Text style={[styles.summary, { color: colors.mutedForeground }]} numberOfLines={2}>
          {event.summary}
        </Text>
      )}

      <View style={styles.bottomRow}>
        <Text style={[styles.sector, { color: colors.mutedForeground }]} numberOfLines={1}>
          {event.sector}
        </Text>
        {event.raiseAmountLocal && (
          <Text style={[styles.raise, { color: colors.secondaryForeground }]}>
            {event.raiseAmountLocal}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  eventBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  regionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  regionText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  midRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  midLeft: {
    flex: 1,
    gap: 2,
  },
  companyName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  exchange: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  metricBlock: {
    alignItems: "flex-end",
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 1,
  },
  summary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sector: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  raise: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
