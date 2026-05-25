import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  MOCK_IPO_EVENTS,
  Region,
  REGION_COLORS,
  REGION_LABELS,
  REGIONS,
} from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { useGenerateReport } from "@workspace/api-client-react";

const REGION_FILTERS: { key: Region | "GLOBAL"; label: string }[] = [
  { key: "GLOBAL", label: "Global" },
  { key: "NORTH_AMERICA", label: "North America" },
  { key: "EUROPE", label: "Europe" },
  { key: "EAST_ASIA", label: "East Asia" },
  { key: "SOUTH_ASIA", label: "South Asia" },
  { key: "MIDDLE_EAST", label: "Middle East" },
  { key: "OCEANIA", label: "Oceania" },
];

function ReportContent({ content }: { content: string }) {
  const colors = useColors();
  const lines = content.split("\n");
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <Text key={i} style={[styles.h2, { color: colors.primary, borderBottomColor: colors.border }]}>
              {line.replace("## ", "")}
            </Text>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <Text key={i} style={[styles.h1, { color: colors.foreground }]}>
              {line.replace("# ", "")}
            </Text>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <Text key={i} style={[styles.h3, { color: colors.foreground }]}>
              {line.replace("### ", "")}
            </Text>
          );
        }
        if (line.startsWith("| ")) {
          return (
            <Text key={i} style={[styles.tableRow, { color: colors.secondaryForeground, borderColor: colors.border }]}>
              {line}
            </Text>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <Text key={i} style={[styles.bullet, { color: colors.foreground }]}>
              {"  •  "}{line.slice(2)}
            </Text>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <Text key={i} style={[styles.bold, { color: colors.foreground }]}>
              {line.replace(/\*\*/g, "")}
            </Text>
          );
        }
        if (line.trim() === "" || line.trim() === "---") {
          return <View key={i} style={{ height: 8 }} />;
        }
        return (
          <Text key={i} style={[styles.body, { color: colors.secondaryForeground }]}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedRegion, setSelectedRegion] = useState<Region | "GLOBAL">("GLOBAL");
  const [report, setReport] = useState<{ content: string; generatedAt: string; region: string } | null>(null);

  const { mutate: generate, isPending } = useGenerateReport({
    mutation: {
      onSuccess: (data) => setReport(data),
      onError: () => {
        setReport({
          content: "## Error\n\nFailed to generate report. Please check your API key configuration and try again.",
          generatedAt: new Date().toISOString(),
          region: selectedRegion,
        });
      },
    },
  });

  const topPadding = Platform.OS === "web" ? 67 : 0;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  const handleGenerate = () => {
    generate({
      data: selectedRegion === "GLOBAL" ? {} : { region: REGION_LABELS[selectedRegion as Region] },
    });
  };

  const eventsForRegion =
    selectedRegion === "GLOBAL"
      ? MOCK_IPO_EVENTS.length
      : MOCK_IPO_EVENTS.filter((e) => e.region === selectedRegion).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.aiDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Intelligence Report</Text>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Powered by Gemini · {eventsForRegion} tracked events
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.scopeLabel, { color: colors.mutedForeground }]}>Report Scope</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionRow}
        >
          {REGION_FILTERS.map(({ key, label }) => {
            const active = selectedRegion === key;
            const rColor = key === "GLOBAL" ? colors.primary : REGION_COLORS[key as Region];
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedRegion(key)}
                style={[
                  styles.regionChip,
                  {
                    backgroundColor: active ? rColor + "22" : colors.secondary,
                    borderColor: active ? rColor : colors.border,
                  },
                ]}
              >
                {key !== "GLOBAL" && (
                  <View style={[styles.chipDot, { backgroundColor: rColor }]} />
                )}
                <Text style={[styles.chipText, { color: active ? rColor : colors.secondaryForeground }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleGenerate}
          disabled={isPending}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              backgroundColor: isPending ? colors.muted : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {isPending ? (
            <>
              <ActivityIndicator size="small" color={colors.primaryForeground} />
              <Text style={[styles.generateBtnText, { color: colors.foreground }]}>
                Generating report...
              </Text>
            </>
          ) : (
            <>
              <Feather name="zap" size={16} color={colors.primaryForeground} />
              <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
                {report ? "Regenerate Report" : "Generate Report"}
              </Text>
            </>
          )}
        </Pressable>

        {isPending && (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
                Sweeping global exchanges...
              </Text>
              <Text style={[styles.loadingBody, { color: colors.mutedForeground }]}>
                Gemini is compiling a comprehensive 48-hour IPO intelligence sweep across all covered jurisdictions.
              </Text>
            </View>
          </View>
        )}

        {!isPending && !report && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="file-text" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No report generated yet
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Tap Generate Report to produce a live AI-compiled Global IPO Intelligence Report covering all material events across 30+ exchanges.
            </Text>
          </View>
        )}

        {!isPending && report && (
          <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.reportMeta, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reportRegion, { color: colors.primary }]}>
                  {report.region}
                </Text>
                <Text style={[styles.reportDate, { color: colors.mutedForeground }]}>
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.liveTag, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.liveText, { color: colors.primary }]}>Live</Text>
              </View>
            </View>
            <View style={{ padding: 16 }}>
              <ReportContent content={report.content} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  scopeLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  regionRow: {
    gap: 6,
    paddingBottom: 4,
  },
  regionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  generateBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  loadingTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  loadingBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  reportRegion: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  reportDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  h1: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  h2: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginTop: 14,
    marginBottom: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  h3: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 10,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  bullet: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  bold: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  tableRow: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    paddingVertical: 3,
    borderBottomWidth: 1,
    lineHeight: 16,
  },
});
