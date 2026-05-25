import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";

const router = Router();

interface CachedResult {
  events: LiveIPOEvent[];
  fetchedAt: string;
}

interface LiveIPOEvent {
  id: string;
  company: string;
  ticker?: string;
  exchange: string;
  region: string;
  sector: string;
  eventType: string;
  raiseAmountUSD?: string;
  raiseAmountLocal?: string;
  offerPrice?: string;
  priceBand?: string;
  postMoneyValuation?: string;
  subscriptionQIB?: number;
  subscriptionNII?: number;
  subscriptionRetail?: number;
  subscriptionOverall?: number;
  gmp?: string;
  day1Performance?: number;
  lotSize?: number;
  leadBookrunners?: string[];
  listingDate?: string;
  filingDate?: string;
  summary: string;
  source: string;
}

const cache = new Map<string, { result: CachedResult; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const VALID_REGIONS = new Set([
  "NORTH_AMERICA",
  "EUROPE",
  "EAST_ASIA",
  "SOUTH_ASIA",
  "MIDDLE_EAST",
  "OCEANIA",
]);

const VALID_EVENT_TYPES = new Set([
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
]);

function extractJSON(text: string): unknown {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in response");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function sanitizeEvent(raw: Record<string, unknown>, idx: number): LiveIPOEvent {
  const region = typeof raw["region"] === "string" && VALID_REGIONS.has(raw["region"])
    ? raw["region"]
    : "NORTH_AMERICA";
  const eventType = typeof raw["eventType"] === "string" && VALID_EVENT_TYPES.has(raw["eventType"])
    ? raw["eventType"]
    : "S1_FILED";

  return {
    id: `live-${Date.now()}-${idx}`,
    company: String(raw["company"] ?? "Unknown Company"),
    ticker: raw["ticker"] ? String(raw["ticker"]) : undefined,
    exchange: String(raw["exchange"] ?? "Unknown Exchange"),
    region,
    sector: String(raw["sector"] ?? "Unknown"),
    eventType,
    raiseAmountUSD: raw["raiseAmountUSD"] ? String(raw["raiseAmountUSD"]) : undefined,
    raiseAmountLocal: raw["raiseAmountLocal"] ? String(raw["raiseAmountLocal"]) : undefined,
    offerPrice: raw["offerPrice"] ? String(raw["offerPrice"]) : undefined,
    priceBand: raw["priceBand"] ? String(raw["priceBand"]) : undefined,
    postMoneyValuation: raw["postMoneyValuation"] ? String(raw["postMoneyValuation"]) : undefined,
    subscriptionQIB: typeof raw["subscriptionQIB"] === "number" ? raw["subscriptionQIB"] : undefined,
    subscriptionNII: typeof raw["subscriptionNII"] === "number" ? raw["subscriptionNII"] : undefined,
    subscriptionRetail: typeof raw["subscriptionRetail"] === "number" ? raw["subscriptionRetail"] : undefined,
    subscriptionOverall: typeof raw["subscriptionOverall"] === "number" ? raw["subscriptionOverall"] : undefined,
    gmp: raw["gmp"] ? String(raw["gmp"]) : undefined,
    day1Performance: typeof raw["day1Performance"] === "number" ? raw["day1Performance"] : undefined,
    lotSize: typeof raw["lotSize"] === "number" ? raw["lotSize"] : undefined,
    leadBookrunners: Array.isArray(raw["leadBookrunners"])
      ? (raw["leadBookrunners"] as unknown[]).map(String)
      : undefined,
    listingDate: raw["listingDate"] ? String(raw["listingDate"]) : undefined,
    filingDate: raw["filingDate"] ? String(raw["filingDate"]) : undefined,
    summary: String(raw["summary"] ?? "No summary available."),
    source: String(raw["source"] ?? "Google Search via Gemini"),
  };
}

router.get("/live", async (req, res) => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Google API key not configured" });
    return;
  }

  const region = typeof req.query["region"] === "string" ? req.query["region"] : undefined;
  const cacheKey = region ?? "global";

  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    res.json({
      events: cached.result.events,
      fetchedAt: cached.result.fetchedAt,
      cached: true,
      totalCount: cached.result.events.length,
    });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      tools: [{ googleSearch: {} }],
    });

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const regionScope = region
      ? `Focus only on the ${region.replace(/_/g, " ")} region.`
      : "Cover all major global exchanges including NYSE, Nasdaq, LSE, HKEX, BSE, NSE, Tadawul, ASX, and others.";

    const prompt = `Today is ${today}. Search the web for the most recent IPO events from the past 7 days across global stock exchanges.

${regionScope}

Return a JSON array (and ONLY the JSON array, no markdown fences, no explanation) of IPO events. Each object must strictly follow this schema:

{
  "company": "string — full legal company name",
  "ticker": "string or null — exchange ticker symbol",
  "exchange": "string — e.g. NYSE, Nasdaq Global Select, LSE, HKEX Main Board, BSE SME",
  "region": "string — MUST be one of exactly: NORTH_AMERICA, EUROPE, EAST_ASIA, SOUTH_ASIA, MIDDLE_EAST, OCEANIA",
  "sector": "string — e.g. Fintech, Healthcare, Technology, Energy",
  "eventType": "string — MUST be one of exactly: S1_FILED, PRICING, DAY1_LISTING, BOOK_BUILDING, SPAC, DIRECT_LISTING, UPLISTING, ALLOTMENT, WITHDRAWAL, RUMOR",
  "raiseAmountUSD": "string or null — e.g. $500M, $1.2B",
  "raiseAmountLocal": "string or null — e.g. ₹420Cr, HK$2.1B",
  "offerPrice": "string or null — e.g. $18.00, ₹72",
  "priceBand": "string or null — e.g. ₹68-72",
  "postMoneyValuation": "string or null — e.g. $4.5B",
  "subscriptionQIB": number or null,
  "subscriptionNII": number or null,
  "subscriptionRetail": number or null,
  "subscriptionOverall": number or null,
  "gmp": "string or null — grey market premium, e.g. +₹18",
  "day1Performance": number or null — percentage gain/loss on listing day,
  "lotSize": number or null,
  "leadBookrunners": ["string"] or null,
  "listingDate": "string or null — ISO date YYYY-MM-DD",
  "filingDate": "string or null — ISO date YYYY-MM-DD",
  "summary": "string — 2-3 sentence factual summary with financial context",
  "source": "string — news source or exchange URL"
}

Include 10-20 events. Use precise figures from actual news sources. Return ONLY the JSON array starting with [ and ending with ].`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = extractJSON(text) as Record<string, unknown>[];

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    const events: LiveIPOEvent[] = parsed.map((raw, idx) =>
      sanitizeEvent(raw as Record<string, unknown>, idx)
    );

    const fetchedAt = new Date().toISOString();
    cache.set(cacheKey, {
      result: { events, fetchedAt },
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    res.json({
      events,
      fetchedAt,
      cached: false,
      totalCount: events.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("Too Many");
    req.log.error({ err }, "Live IPO fetch failed");
    res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? "Rate limit reached — your Google API key's free-tier quota is temporarily exhausted. The app will use sample data in the meantime. Try again in ~60 seconds."
        : "Failed to fetch live IPO data. Please try again.",
    });
  }
});

export default router;
