import { useGetLiveIpoEvents } from "@workspace/api-client-react";

import { MOCK_IPO_EVENTS, IPOEvent, EventType, Region } from "@/constants/mockData";

function parseUSDMillions(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.BbMmKk]/g, "");
  const lower = val.toLowerCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (lower.includes("b")) return num * 1000;
  if (lower.includes("m")) return num;
  if (lower.includes("k")) return num / 1000;
  return num;
}

function formatTotalRaised(events: IPOEvent[]): string {
  const totalM = events.reduce((sum, e) => sum + parseUSDMillions(e.raiseAmountUSD), 0);
  if (totalM === 0) return "N/A";
  if (totalM >= 1000) return `$${(totalM / 1000).toFixed(1)}B`;
  return `$${Math.round(totalM)}M`;
}

function mapRegion(r: string): Region {
  const valid: Region[] = [
    "NORTH_AMERICA",
    "EUROPE",
    "EAST_ASIA",
    "SOUTH_ASIA",
    "MIDDLE_EAST",
    "OCEANIA",
  ];
  return valid.includes(r as Region) ? (r as Region) : "NORTH_AMERICA";
}

function mapEventType(t: string): EventType {
  const valid: EventType[] = [
    "S1_FILED",
    "PRICING",
    "DAY1_LISTING",
    "BOOK_BUILDING",
    "SPAC",
    "DIRECT_LISTING",
    "UPLISTING",
    "ALLOTMENT",
    "WITHDRAWAL",
    "RUMOR",
  ];
  return valid.includes(t as EventType) ? (t as EventType) : "S1_FILED";
}

export const UPCOMING_TYPES: EventType[] = [
  "S1_FILED",
  "BOOK_BUILDING",
  "PRICING",
  "ALLOTMENT",
  "SPAC",
  "DIRECT_LISTING",
  "UPLISTING",
  "RUMOR",
];

function sortByDate(a: IPOEvent, b: IPOEvent): number {
  const da = a.listingDate ?? a.filingDate ?? "9999";
  const db = b.listingDate ?? b.filingDate ?? "9999";
  return da.localeCompare(db);
}

export const MOCK_UPCOMING_EVENTS: IPOEvent[] = MOCK_IPO_EVENTS
  .filter((e) => UPCOMING_TYPES.includes(e.eventType))
  .sort(sortByDate);

export type DataSource = "live" | "cached" | "sample" | "loading" | "rate_limited";

export interface LiveIPOState {
  events: IPOEvent[];
  isLoading: boolean;
  isLive: boolean;
  isCached: boolean;
  dataSource: DataSource;
  fetchedAt: string | null;
  totalRaised: string;
  refetch: () => void;
}

export function useLiveIPOEvents(): LiveIPOState {
  const { data, isLoading, isError, error, refetch } = useGetLiveIpoEvents(undefined, {
    query: {
      staleTime: 15 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  const rawEvents = data?.events ?? [];
  const hasLive = rawEvents.length > 0 && !isError;

  const isRateLimited =
    isError &&
    (String((error as { message?: string })?.message ?? "").includes("quota") ||
      String((error as { message?: string })?.message ?? "").includes("429") ||
      String((error as { status?: number })?.status ?? "").includes("429"));

  const events: IPOEvent[] = hasLive
    ? rawEvents
        .filter((e) => UPCOMING_TYPES.includes(mapEventType(e.eventType)))
        .map((e, idx) => ({
          id: e.id ?? `live-${idx}`,
          company: e.company,
          ticker: e.ticker ?? undefined,
          exchange: e.exchange,
          region: mapRegion(e.region),
          sector: e.sector,
          eventType: mapEventType(e.eventType),
          raiseAmountUSD: e.raiseAmountUSD ?? undefined,
          raiseAmountLocal: e.raiseAmountLocal ?? undefined,
          offerPrice: e.offerPrice ?? undefined,
          priceBand: e.priceBand ?? undefined,
          postMoneyValuation: e.postMoneyValuation ?? undefined,
          subscriptionQIB: e.subscriptionQIB ?? undefined,
          subscriptionNII: e.subscriptionNII ?? undefined,
          subscriptionRetail: e.subscriptionRetail ?? undefined,
          subscriptionOverall: e.subscriptionOverall ?? undefined,
          gmp: e.gmp ?? undefined,
          day1Performance: undefined,
          lotSize: e.lotSize ?? undefined,
          leadBookrunners: e.leadBookrunners ?? undefined,
          listingDate: e.listingDate ?? undefined,
          filingDate: e.filingDate ?? undefined,
          summary: e.summary,
          source: e.source,
        }))
        .sort(sortByDate)
    : MOCK_UPCOMING_EVENTS;

  const dataSource: DataSource = isLoading
    ? "loading"
    : hasLive && data?.cached
    ? "cached"
    : hasLive
    ? "live"
    : isRateLimited
    ? "rate_limited"
    : "sample";

  return {
    events,
    isLoading,
    isLive: hasLive,
    isCached: data?.cached ?? false,
    dataSource,
    fetchedAt: data?.fetchedAt ?? null,
    totalRaised: formatTotalRaised(events),
    refetch,
  };
}
