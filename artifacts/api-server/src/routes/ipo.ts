import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync } from "fs";
import { Router } from "express";

const router = Router();

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
  filingUrl?: string;
  summary: string;
  source: string;
}

interface CachedResult {
  events: LiveIPOEvent[];
  fetchedAt: string;
  modelUsed: string;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DISK_CACHE_PATH = "/tmp/ipo-live-cache.json";
const memCache = new Map<string, { result: CachedResult; expiresAt: number }>();

const MODELS = [
  { model: "gemini-2.5-pro", apiVersion: "v1" as const },
  { model: "gemini-2.0-flash", apiVersion: "v1beta" as const },
  { model: "gemini-2.0-flash-lite", apiVersion: "v1beta" as const },
];

const VALID_REGIONS = new Set([
  "NORTH_AMERICA", "EUROPE", "EAST_ASIA", "SOUTH_ASIA", "MIDDLE_EAST", "OCEANIA",
]);

const VALID_EVENT_TYPES = new Set([
  "S1_FILED", "PRICING", "DAY1_LISTING", "BOOK_BUILDING", "SPAC",
  "DIRECT_LISTING", "UPLISTING", "ALLOTMENT", "WITHDRAWAL", "RUMOR",
]);

function readDiskCache(key: string): { result: CachedResult; expiresAt: number } | null {
  try {
    const raw = readFileSync(DISK_CACHE_PATH, "utf8");
    const all = JSON.parse(raw) as Record<string, { result: CachedResult; expiresAt: number }>;
    return all[key] ?? null;
  } catch {
    return null;
  }
}

function writeDiskCache(key: string, result: CachedResult): void {
  try {
    let all: Record<string, { result: CachedResult; expiresAt: number }> = {};
    try { all = JSON.parse(readFileSync(DISK_CACHE_PATH, "utf8")); } catch { /* empty */ }
    all[key] = { result, expiresAt: Date.now() + CACHE_TTL_MS };
    writeFileSync(DISK_CACHE_PATH, JSON.stringify(all));
  } catch { /* non-fatal */ }
}

function extractJSON(text: string): unknown {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array found");
  return JSON.parse(text.slice(start, end + 1));
}

function sanitizeEvent(raw: Record<string, unknown>, idx: number): LiveIPOEvent {
  const region = typeof raw["region"] === "string" && VALID_REGIONS.has(raw["region"])
    ? raw["region"] : "NORTH_AMERICA";
  const eventType = typeof raw["eventType"] === "string" && VALID_EVENT_TYPES.has(raw["eventType"])
    ? raw["eventType"] : "S1_FILED";

  return {
    id: `live-${Date.now()}-${idx}`,
    company: String(raw["company"] ?? "Unknown"),
    ticker: raw["ticker"] ? String(raw["ticker"]) : undefined,
    exchange: String(raw["exchange"] ?? "Unknown"),
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
      ? (raw["leadBookrunners"] as unknown[]).map(String) : undefined,
    listingDate: raw["listingDate"] ? String(raw["listingDate"]) : undefined,
    filingDate: raw["filingDate"] ? String(raw["filingDate"]) : undefined,
    filingUrl: raw["filingUrl"] ? String(raw["filingUrl"]) : undefined,
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

  const memEntry = memCache.get(cacheKey);
  if (memEntry && Date.now() < memEntry.expiresAt) {
    res.json({ events: memEntry.result.events, fetchedAt: memEntry.result.fetchedAt,
      cached: true, totalCount: memEntry.result.events.length, modelUsed: memEntry.result.modelUsed });
    return;
  }

  const diskEntry = readDiskCache(cacheKey);
  if (diskEntry && Date.now() < diskEntry.expiresAt) {
    memCache.set(cacheKey, diskEntry);
    res.json({ events: diskEntry.result.events, fetchedAt: diskEntry.result.fetchedAt,
      cached: true, totalCount: diskEntry.result.events.length, modelUsed: diskEntry.result.modelUsed });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const regionScope = region
    ? `Focus only on the ${region.replace(/_/g, " ")} region.`
    : "Cover all major global exchanges: NYSE, Nasdaq, LSE, AIM, Euronext, HKEX, BSE, NSE, Tadawul, DFM, ADX, ASX, TSE, SGX, and others.";

  const prompt = `Today is ${today}. Search the web for UPCOMING IPOs — companies that have NOT yet begun trading. Include pipeline deals only: S-1/DRHP filings, active book-building, upcoming pricings, allotments for deals listing in the next 30 days, SPACs, and confirmed market rumors about planned listings. Do NOT include companies that have already listed and are trading.

${regionScope}

Also include any high-profile RUMORED IPOs (e.g. SpaceX, Stripe, Shein, or other widely discussed potential listings) with eventType "RUMOR".

Return a JSON array (ONLY the array, no markdown, no explanation). Each object:
{
  "company": "full legal name",
  "ticker": "proposed ticker or null",
  "exchange": "e.g. NYSE, Nasdaq Global Select, LSE, HKEX Main Board, BSE SME",
  "region": "MUST be one of: NORTH_AMERICA, EUROPE, EAST_ASIA, SOUTH_ASIA, MIDDLE_EAST, OCEANIA",
  "sector": "e.g. Fintech, AI, Energy",
  "eventType": "MUST be one of: S1_FILED, BOOK_BUILDING, ALLOTMENT, PRICING, SPAC, DIRECT_LISTING, UPLISTING, RUMOR",
  "raiseAmountUSD": "$XM or $XB or null",
  "raiseAmountLocal": "local currency or null",
  "offerPrice": "fixed price or null",
  "priceBand": "e.g. ₹68-72 or null",
  "postMoneyValuation": "e.g. $4.5B or null",
  "subscriptionQIB": number or null,
  "subscriptionNII": number or null,
  "subscriptionRetail": number or null,
  "subscriptionOverall": number or null,
  "gmp": "grey market premium or null",
  "day1Performance": null,
  "lotSize": number or null,
  "leadBookrunners": ["bank names"] or null,
  "listingDate": "YYYY-MM-DD or null",
  "filingDate": "YYYY-MM-DD or null",
  "filingUrl": "direct URL to SEC EDGAR / HKEX / BSE / NSE / exchange filing page or null",
  "summary": "2-3 sentences: what company does, deal size, expected listing date",
  "source": "news source URL or exchange filing URL"
}

Include 12-20 deals. Use real figures from filings and news. Return ONLY the JSON array.`;

  let lastError: Error | null = null;

  for (const { model, apiVersion } of MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion });
      const geminiModel = genAI.getGenerativeModel({
        model,
        tools: [{ googleSearch: {} }],
      });

      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const parsed = extractJSON(text) as Record<string, unknown>[];

      if (!Array.isArray(parsed)) throw new Error("Response is not an array");

      const events = parsed.map((raw, idx) => sanitizeEvent(raw as Record<string, unknown>, idx));
      const fetchedAt = new Date().toISOString();
      const cacheResult: CachedResult = { events, fetchedAt, modelUsed: model };

      memCache.set(cacheKey, { result: cacheResult, expiresAt: Date.now() + CACHE_TTL_MS });
      writeDiskCache(cacheKey, cacheResult);

      res.json({ events, fetchedAt, cached: false, totalCount: events.length, modelUsed: model });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many")) {
        req.log.warn({ model }, "Model quota exhausted, trying next");
        lastError = err instanceof Error ? err : new Error(msg);
        continue;
      }
      req.log.error({ err, model }, "Non-quota error from model");
      lastError = err instanceof Error ? err : new Error(msg);
      continue;
    }
  }

  req.log.error({ lastError }, "All models exhausted");

  const staleDisk = readDiskCache(cacheKey);
  if (staleDisk) {
    res.json({
      events: staleDisk.result.events,
      fetchedAt: staleDisk.result.fetchedAt,
      cached: true,
      stale: true,
      totalCount: staleDisk.result.events.length,
      modelUsed: staleDisk.result.modelUsed,
    });
    return;
  }

  res.status(429).json({
    error: "All AI models temporarily quota-limited. Using sample data. Quota resets every 24h — try again later.",
  });
});

export default router;
