import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { openUrl } from "@/lib/openUrl";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MetricBadge } from "@/components/MetricBadge";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  REGION_COLORS,
  REGION_LABELS,
} from "@/constants/mockData";
import { useWatchlist } from "@/context/WatchlistContext";
import { useColors } from "@/hooks/useColors";
import { findEventById } from "@/lib/eventsStore";

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function DetailRow({ label, value, valueColor }: DetailRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.foreground }]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionCardTitle, { color: colors.primary, borderBottomColor: colors.border }]}>
        {title}
      </Text>
      <View style={styles.sectionCardContent}>{children}</View>
    </View>
  );
}

const REGION_FILING_LABELS: Record<string, string> = {
  NORTH_AMERICA: "SEC EDGAR",
  EUROPE: "Exchange Prospectus",
  EAST_ASIA: "HKEX / TSE / SGX Filing",
  SOUTH_ASIA: "BSE / NSE / SEBI Filing",
  MIDDLE_EAST: "Tadawul / DFM Filing",
  OCEANIA: "ASX / ASIC Filing",
};

export default function IPODetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isWatched, toggleWatch } = useWatchlist();

  const event = findEventById(id ?? "");
  const watched = event ? isWatched(event.id) : false;

  const bottomPadding = Platform.OS === "web" ? 34 + 16 : insets.bottom + 16;
  const isRumor = event?.eventType === "RUMOR";

  if (!event) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Event not found</Text>
      </View>
    );
  }

  const eventColor = EVENT_TYPE_COLORS[event.eventType];
  const regionColor = REGION_COLORS[event.region];
  const filingLabel = REGION_FILING_LABELS[event.region] ?? "Regulatory Filing";

  return (
    <>
      <Stack.Screen
        options={{
          title: event.company,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: "Inter_600SemiBold", color: colors.foreground },
          headerRight: () => (
            <Pressable onPress={() => toggleWatch(event.id)} style={{ marginRight: 8 }}>
              <Feather
                name="bookmark"
                size={20}
                color={watched ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.heroCard,
          {
            backgroundColor: colors.card,
            borderBottomColor: isRumor ? "#94a3b844" : colors.border,
            borderLeftWidth: isRumor ? 0 : 0,
          }
        ]}>
          {isRumor && (
            <View style={styles.rumorWarning}>
              <Feather name="alert-triangle" size={12} color="#b45308" />
              <Text style={styles.rumorWarningText}>UNVERIFIED MARKET RUMOR — Not a confirmed filing</Text>
            </View>
          )}
          <View style={styles.badgeRow}>
            <View style={[styles.eventBadge, { backgroundColor: eventColor + "22", borderColor: eventColor + "55" }]}>
              <Text style={[styles.eventBadgeText, { color: eventColor }]}>
                {EVENT_TYPE_LABELS[event.eventType]}
              </Text>
            </View>
            <View style={[styles.regionBadge, { backgroundColor: regionColor + "22", borderColor: regionColor + "44" }]}>
              <View style={[styles.regionDot, { backgroundColor: regionColor }]} />
              <Text style={[styles.regionBadgeText, { color: regionColor }]}>
                {REGION_LABELS[event.region]}
              </Text>
            </View>
          </View>

          <Text style={[styles.companyName, { color: colors.foreground }]}>{event.company}</Text>
          <Text style={[styles.exchangeLine, { color: colors.mutedForeground }]}>
            {event.exchange}{event.ticker ? ` · ${event.ticker}` : ""}
          </Text>
          <Text style={[styles.sector, { color: colors.mutedForeground }]}>{event.sector}</Text>

          <View style={styles.metricsRow}>
            {event.raiseAmountUSD && (
              <MetricBadge label="Raise (USD)" value={event.raiseAmountUSD} />
            )}
            {event.postMoneyValuation && (
              <MetricBadge label={isRumor ? "Est. Valuation" : "Valuation"} value={event.postMoneyValuation} />
            )}
            {event.day1Performance != null && (
              <MetricBadge
                label="Day 1"
                value={`${event.day1Performance >= 0 ? "+" : ""}${event.day1Performance.toFixed(1)}%`}
                valueColor={event.day1Performance >= 0 ? colors.success : colors.destructive}
              />
            )}
            {event.subscriptionOverall != null && (
              <MetricBadge
                label="Sub Overall"
                value={`${event.subscriptionOverall.toFixed(2)}x`}
                valueColor={colors.primary}
              />
            )}
          </View>

          {event.filingUrl && (
            <Pressable
              onPress={() => openUrl(event.filingUrl!)}
              style={[styles.filingButton, { borderColor: colors.primary + "66", backgroundColor: colors.primary + "14" }]}
            >
              <Feather name="external-link" size={13} color={colors.primary} />
              <Text style={[styles.filingButtonText, { color: colors.primary }]}>
                View {filingLabel}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <SectionCard title="Deal Mechanics & Financial Metrics">
            {event.offerPrice && <DetailRow label="Offer Price" value={event.offerPrice} />}
            {event.priceBand && <DetailRow label="Price Band" value={event.priceBand} />}
            {event.raiseAmountLocal && <DetailRow label="Raise (Local)" value={event.raiseAmountLocal} />}
            {event.raiseAmountUSD && <DetailRow label="Raise (USD)" value={event.raiseAmountUSD} />}
            {event.postMoneyValuation && <DetailRow label="Post-Money Valuation" value={event.postMoneyValuation} />}
            {event.listingDate && <DetailRow label="Listing Date" value={event.listingDate} />}
            {event.filingDate && <DetailRow label="Filing Date" value={event.filingDate} />}
            {event.lotSize && <DetailRow label="Lot Size" value={`${event.lotSize.toLocaleString()} shares`} />}
          </SectionCard>

          {(event.subscriptionQIB != null || event.subscriptionNII != null || event.subscriptionRetail != null || event.subscriptionOverall != null || event.gmp || event.day1Performance != null) && (
            <SectionCard title="Subscription & Sentiment Data">
              {event.subscriptionQIB != null && (
                <DetailRow label="QIB Subscription" value={`${event.subscriptionQIB.toFixed(2)}x`} valueColor={colors.primary} />
              )}
              {event.subscriptionNII != null && (
                <DetailRow label="NII Subscription" value={`${event.subscriptionNII.toFixed(2)}x`} valueColor={colors.primary} />
              )}
              {event.subscriptionRetail != null && (
                <DetailRow label="Retail Subscription" value={`${event.subscriptionRetail.toFixed(2)}x`} valueColor={colors.primary} />
              )}
              {event.subscriptionOverall != null && (
                <DetailRow label="Overall Subscription" value={`${event.subscriptionOverall.toFixed(2)}x`} valueColor={colors.primary} />
              )}
              {event.gmp && (
                <DetailRow label="Grey Market Premium" value={event.gmp} valueColor={colors.success} />
              )}
              {event.day1Performance != null && (
                <DetailRow
                  label="Day 1 Performance"
                  value={`${event.day1Performance >= 0 ? "+" : ""}${event.day1Performance.toFixed(1)}% vs. offer`}
                  valueColor={event.day1Performance >= 0 ? colors.success : colors.destructive}
                />
              )}
            </SectionCard>
          )}

          {event.leadBookrunners && event.leadBookrunners.length > 0 && (
            <SectionCard title="Underwriters & Advisors">
              <DetailRow label="Lead Bookrunners" value={event.leadBookrunners.join(", ")} />
            </SectionCard>
          )}

          <SectionCard title="Operational Context">
            <Text style={[styles.summaryText, { color: colors.secondaryForeground }]}>
              {event.summary}
            </Text>
          </SectionCard>

          <SectionCard title="Information Source & Verification">
            {event.filingUrl ? (
              <View style={styles.sourceWithLink}>
                <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
                  {event.source}
                </Text>
                <Pressable
                  onPress={() => openUrl(event.filingUrl!)}
                  style={[styles.sourceLink, { borderColor: colors.border }]}
                >
                  <Feather name="external-link" size={12} color={colors.primary} />
                  <Text style={[styles.sourceLinkText, { color: colors.primary }]}>
                    Open {filingLabel}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
                {event.source}
              </Text>
            )}
          </SectionCard>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 6,
  },
  rumorWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#b4530814",
    borderWidth: 1,
    borderColor: "#b4530844",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  rumorWarningText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#b45308",
    letterSpacing: 0.3,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  eventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  eventBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  regionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  regionBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  exchangeLine: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sector: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  filingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  filingButtonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionCardTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionCardContent: {
    padding: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 2,
    textAlign: "right",
  },
  summaryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    padding: 12,
  },
  sourceWithLink: {
    gap: 0,
  },
  sourceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    margin: 12,
    marginTop: 0,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sourceLinkText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
