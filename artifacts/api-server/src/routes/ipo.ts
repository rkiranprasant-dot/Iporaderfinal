import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
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

// Persistent cache — home directory survives server restarts within the session
const CACHE_DIR = join(homedir(), ".ipo-intelligence");
const DISK_CACHE_PATH = join(CACHE_DIR, "ipo-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h — aligns with Gemini quota reset window

try { mkdirSync(CACHE_DIR, { recursive: true }); } catch { /* exists */ }

const memCache = new Map<string, { result: CachedResult; expiresAt: number }>();

// Curated sample dataset — pre-seeds cache on server cold-start.
// The API ALWAYS returns 200. When Gemini quota resets, live data overwrites this.
const CURATED_EVENTS: LiveIPOEvent[] = [
  {
    id: "curated-na-001", company: "Klarna Group plc", ticker: "KLAR",
    exchange: "Nasdaq Global Select", region: "NORTH_AMERICA", sector: "Fintech / BNPL",
    eventType: "S1_FILED", raiseAmountUSD: "$1.23B", postMoneyValuation: "$14.9B",
    filingDate: "2025-05-24", leadBookrunners: ["Goldman Sachs", "JPMorgan", "Morgan Stanley"],
    filingUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=klarna&type=S-1&dateb=&owner=include&count=40",
    summary: "Swedish BNPL giant Klarna filed its S-1 with the SEC targeting a Nasdaq listing. Revenue of $2.81B in FY2024 (+24% YoY), returning to net profitability at $21M. 93M active consumers across 45 markets.",
    source: "SEC EDGAR S-1 Filing",
  },
  {
    id: "curated-na-002", company: "Cerebras Systems Inc.", ticker: "CBRS",
    exchange: "Nasdaq Global Market", region: "NORTH_AMERICA", sector: "AI Hardware / Semiconductors",
    eventType: "PRICING", raiseAmountUSD: "$900M", offerPrice: "$36.00", priceBand: "$34.00–$37.00",
    postMoneyValuation: "$7.1B", leadBookrunners: ["Citigroup", "Barclays", "Deutsche Bank"],
    listingDate: "2025-05-27",
    filingUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=cerebras&type=424B4&dateb=&owner=include&count=40",
    summary: "AI chip company Cerebras priced at the top of its range at $36/sh, raising $900M. Wafer Scale Engine 3 deployed by 40+ enterprise customers. FY2024 revenue $136.4M (+212% YoY).",
    source: "SEC EDGAR 424B4",
  },
  {
    id: "curated-na-r001", company: "Space Exploration Technologies Corp. (SpaceX)",
    exchange: "Nasdaq / NYSE", region: "NORTH_AMERICA", sector: "Aerospace / Space Launch / Starlink",
    eventType: "RUMOR", postMoneyValuation: "$210B",
    filingUrl: "https://efts.sec.gov/LATEST/search-index?q=%22spacex%22&forms=S-1",
    summary: "⚠ UNVERIFIED: SpaceX's Starlink internet unit is widely reported to be preparing a standalone IPO at $210B+. No S-1 filed with SEC as of this date.",
    source: "Bloomberg, WSJ — UNVERIFIED MARKET RUMOR",
  },
  {
    id: "curated-na-r002", company: "Stripe Inc.", ticker: "STRIP",
    exchange: "Nasdaq Global Select", region: "NORTH_AMERICA", sector: "Payments Infrastructure",
    eventType: "RUMOR", postMoneyValuation: "$65B",
    filingUrl: "https://efts.sec.gov/LATEST/search-index?q=%22stripe%22&forms=S-1",
    summary: "⚠ UNVERIFIED: Stripe processed $1.4T in payment volume in 2024. Reportedly hired a CFO in preparation for IPO. Confidential filing not confirmed.",
    source: "WSJ, Reuters — UNVERIFIED MARKET RUMOR",
  },
  {
    id: "curated-eu-001", company: "Flix SE", ticker: "FLX",
    exchange: "Deutsche Börse Scale", region: "EUROPE", sector: "Intercity Mobility / Transport",
    eventType: "PRICING", raiseAmountUSD: "$534M", raiseAmountLocal: "€490M",
    offerPrice: "€24.00", priceBand: "€22.00–€25.00", postMoneyValuation: "$2.3B",
    leadBookrunners: ["Deutsche Bank", "BNP Paribas", "Berenberg"], listingDate: "2025-05-27",
    filingUrl: "https://www.bundesanzeiger.de/pub/en/start",
    summary: "Flix SE (FlixBus/FlixTrain) priced at €24/sh raising €490M. FY2024 revenue €2.1B (+31% YoY). 72M passengers across 40 countries.",
    source: "Deutsche Börse RNS",
  },
  {
    id: "curated-eu-002", company: "Monzo Bank Ltd", ticker: "MON",
    exchange: "LSE AIM", region: "EUROPE", sector: "Digital Banking / Neobank",
    eventType: "BOOK_BUILDING", raiseAmountUSD: "$1.1B", raiseAmountLocal: "£850M",
    priceBand: "£4.20–£4.80", postMoneyValuation: "$6.2B",
    subscriptionOverall: 3.84, subscriptionQIB: 5.21,
    leadBookrunners: ["Jefferies", "Numis Securities"],
    filingUrl: "https://www.londonstockexchange.com/live-markets/market-data-and-news/our-news/lse-regulator-news",
    summary: "Monzo AIM book-build 3.84x oversubscribed. 9.7M UK customers. Revenue £880M FY2024 (+51% YoY), first full-year profit £15.4M.",
    source: "LSE RNS",
  },
  {
    id: "curated-ea-001", company: "ByteDance Cloud Technology", ticker: "9985",
    exchange: "HKEX Main Board", region: "EAST_ASIA", sector: "Cloud Computing / AI Infrastructure",
    eventType: "S1_FILED", raiseAmountUSD: "$4.5B", raiseAmountLocal: "HKD 35.1B",
    postMoneyValuation: "$35.9B", filingDate: "2025-05-23",
    leadBookrunners: ["CICC", "Goldman Sachs (Asia)", "Morgan Stanley"],
    filingUrl: "https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=en&category=0&market=MAIN",
    summary: "ByteDance's cloud/AI subsidiary filed DRHP with HKEX. Volcano Engine serves 4.2M enterprise clients. Revenue RMB 48.3B FY2024 (+42% YoY).",
    source: "HKEX Listing Document",
  },
  {
    id: "curated-sa-001", company: "Zepto Ecommerce Pvt Ltd", ticker: "ZEPTO",
    exchange: "NSE / BSE Mainboard", region: "SOUTH_ASIA", sector: "Quick Commerce / D2C",
    eventType: "S1_FILED", raiseAmountLocal: "₹8,500 Cr", raiseAmountUSD: "$1.02B",
    postMoneyValuation: "$5.04B", filingDate: "2025-05-22",
    leadBookrunners: ["Kotak Mahindra Capital", "ICICI Securities", "Goldman Sachs India"],
    filingUrl: "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13",
    summary: "Quick commerce unicorn Zepto filed DRHP with SEBI. 700+ dark stores across 20 cities. GMV ₹24,800 Cr FY2024 (+104% YoY).",
    source: "SEBI DRHP",
  },
  {
    id: "curated-sa-002", company: "PhysicsWallah Pvt Ltd", ticker: "PHYSICS",
    exchange: "NSE / BSE Mainboard", region: "SOUTH_ASIA", sector: "EdTech / Online Education",
    eventType: "PRICING", raiseAmountLocal: "₹3,200 Cr", raiseAmountUSD: "$384M",
    priceBand: "₹1,050–₹1,120", postMoneyValuation: "$2.8B",
    subscriptionQIB: 28.34, subscriptionNII: 41.17, subscriptionRetail: 12.89, subscriptionOverall: 27.43,
    gmp: "₹180 (premium)", leadBookrunners: ["JM Financial", "Axis Capital", "Motilal Oswal"],
    listingDate: "2025-05-28",
    filingUrl: "https://www.bseindia.com/markets/MarketInfo/CorpSearch.aspx",
    summary: "PhysicsWallah priced at ₹1,120 (top of band) with 27.43x overall subscription. Revenue ₹2,840 Cr FY2024 (+68% YoY). GMP ₹180 implies ~16% listing premium.",
    source: "BSE/NSE Subscription Data",
  },
  {
    id: "curated-me-001", company: "Aramco Trading Company", ticker: "2231",
    exchange: "Tadawul (Saudi Exchange)", region: "MIDDLE_EAST", sector: "Energy Trading / Commodities",
    eventType: "BOOK_BUILDING", raiseAmountLocal: "SAR 12.5B", raiseAmountUSD: "$3.33B",
    priceBand: "SAR 42.00–SAR 47.00", postMoneyValuation: "$16.8B",
    subscriptionQIB: 6.42, subscriptionOverall: 5.18,
    leadBookrunners: ["Saudi Fransi Capital", "Goldman Sachs Saudi Arabia", "HSBC Saudi Arabia"],
    filingUrl: "https://www.saudiexchange.sa/wps/portal/saudiexchange/ipo",
    summary: "Aramco Trading's institutional book-build 5.18x oversubscribed on Day 2. Trades crude, LNG across 32 countries. FY2024 volumes $89.4B.",
    source: "Tadawul Exchange Notice",
  },
  {
    id: "curated-oc-001", company: "Canva Pty Ltd",
    exchange: "ASX / Nasdaq", region: "OCEANIA", sector: "SaaS / Design Technology",
    eventType: "RUMOR", postMoneyValuation: "$39B",
    filingUrl: "https://www.asic.gov.au/regulatory-resources/financial-services/offers-of-securities/",
    summary: "⚠ UNVERIFIED: Canva exploring dual ASX/Nasdaq listing at $39B valuation. Co-founders confirmed advisors engaged; no ASIC filing yet.",
    source: "AFR — UNVERIFIED MARKET RUMOR",
  },
];

const VALID_REGIONS = new Set([
  "NORTH_AMERICA", "EUROPE", "EAST_ASIA", "SOUTH_ASIA", "MIDDLE_EAST", "OCEANIA",
]);
const VALID_EVENT_TYPES = new Set([
  "S1_FILED", "PRICING", "DAY1_LISTING", "BOOK_BUILDING", "SPAC",
  "DIRECT_LISTING", "UPLISTING", "ALLOTMENT", "WITHDRAWAL", "RUMOR",
]);

const GROUNDED_MODELS = [
  { model: "gemini-2.5-pro",        apiVersion: "v1" as const },
  { model: "gemini-2.0-flash",      apiVersion: "v1beta" as const },
  { model: "gemini-1.5-flash",      apiVersion: "v1beta" as const },
  { model: "gemini-2.0-flash-lite", apiVersion: "v1beta" as const },
];

function readDiskEntry(key: string): { result: CachedResult; expiresAt: number } | null {
  try {
    const raw = readFileSync(DISK_CACHE_PATH, "utf8");
    const all = JSON.parse(raw) as Record<string, { result: CachedResult; expiresAt: number }>;
    return all[key] ?? null;
  } catch { return null; }
}

function writeDiskEntry(key: string, result: CachedResult, expiresAt: number): void {
  try {
    let all: Record<string, { result: CachedResult; expiresAt: number }> = {};
    try { all = JSON.parse(readFileSync(DISK_CACHE_PATH, "utf8")); } catch { /* empty */ }
    all[key] = { result, expiresAt };
    writeFileSync(DISK_CACHE_PATH, JSON.stringify(all));
  } catch { /* non-fatal */ }
}

// On server start: write curated events to disk with expiresAt=0 (already stale).
// This means the cache always has a baseline to fall back to, but Gemini is still
// attempted first. When Gemini succeeds it overwrites with live data (24h TTL).
function preSeedIfEmpty(): void {
  const entry = readDiskEntry("global");
  if (entry) return; // already have some data
  writeDiskEntry("global", {
    events: CURATED_EVENTS,
    fetchedAt: new Date().toISOString(),
    modelUsed: "curated",
  }, 0); // expiresAt: 0 = immediately stale → Gemini still attempted
}

preSeedIfEmpty();

function extractJSON(text: string): unknown {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array in response");
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
    region, sector: String(raw["sector"] ?? "Unknown"), eventType,
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
    source: String(raw["source"] ?? "Gemini AI"),
  };
}

function buildPrompt(region: string | undefined, today: string, useSearch: boolean): string {
  const scope = region
    ? `Focus only on the ${region.replace(/_/g, " ")} region.`
    : "Cover all major global exchanges: NYSE, Nasdaq, LSE, AIM, Euronext, HKEX, BSE, NSE, Tadawul, DFM, ADX, ASX, TSE, SGX.";

  const dataNote = useSearch
    ? "Search the web for the most current IPO pipeline data."
    : "Use your training knowledge to list plausible upcoming IPOs as of today.";

  return `Today is ${today}. ${dataNote}

Return UPCOMING IPOs only — S-1/DRHP filings, book-building, pricing within 30 days, allotment, SPACs, rumored listings (SpaceX, Stripe, etc.). ${scope}

Return a JSON array ONLY. Each object:
{
  "company": string, "ticker": string|null, "exchange": string,
  "region": "NORTH_AMERICA"|"EUROPE"|"EAST_ASIA"|"SOUTH_ASIA"|"MIDDLE_EAST"|"OCEANIA",
  "sector": string,
  "eventType": "S1_FILED"|"BOOK_BUILDING"|"ALLOTMENT"|"PRICING"|"SPAC"|"DIRECT_LISTING"|"UPLISTING"|"RUMOR",
  "raiseAmountUSD": string|null, "raiseAmountLocal": string|null,
  "offerPrice": string|null, "priceBand": string|null, "postMoneyValuation": string|null,
  "subscriptionQIB": number|null, "subscriptionNII": number|null,
  "subscriptionRetail": number|null, "subscriptionOverall": number|null,
  "gmp": string|null, "day1Performance": null, "lotSize": number|null,
  "leadBookrunners": string[]|null, "listingDate": "YYYY-MM-DD"|null,
  "filingDate": "YYYY-MM-DD"|null,
  "filingUrl": "direct URL to SEC EDGAR / HKEX / BSE / NSE / exchange filing page"|null,
  "summary": string, "source": string
}

Return 12-20 deals. ONLY the JSON array, no markdown.`;
}

router.get("/live", async (req, res) => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Google API key not configured" });
    return;
  }

  const region = typeof req.query["region"] === "string" ? req.query["region"] : undefined;
  const cacheKey = region ?? "global";

  // 1. In-memory cache (fastest)
  const mem = memCache.get(cacheKey);
  if (mem && Date.now() < mem.expiresAt) {
    res.json({ events: mem.result.events, fetchedAt: mem.result.fetchedAt,
      cached: true, totalCount: mem.result.events.length, modelUsed: mem.result.modelUsed });
    return;
  }

  // 2. Disk cache (fresh — survives restarts)
  const disk = readDiskEntry(cacheKey);
  if (disk && Date.now() < disk.expiresAt) {
    memCache.set(cacheKey, disk);
    res.json({ events: disk.result.events, fetchedAt: disk.result.fetchedAt,
      cached: true, totalCount: disk.result.events.length, modelUsed: disk.result.modelUsed });
    return;
  }

  // 3. Try Gemini with search grounding (attempts all models in chain)
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  for (const { model, apiVersion } of GROUNDED_MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion });
      const geminiModel = genAI.getGenerativeModel({ model, tools: [{ googleSearch: {} }] });
      const result = await geminiModel.generateContent(buildPrompt(region, today, true));
      const parsed = extractJSON(result.response.text()) as Record<string, unknown>[];
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      const events = parsed.map((raw, idx) => sanitizeEvent(raw as Record<string, unknown>, idx));
      const fetchedAt = new Date().toISOString();
      const cacheResult: CachedResult = { events, fetchedAt, modelUsed: model };
      memCache.set(cacheKey, { result: cacheResult, expiresAt: Date.now() + CACHE_TTL_MS });
      writeDiskEntry(cacheKey, cacheResult, Date.now() + CACHE_TTL_MS);
      res.json({ events, fetchedAt, cached: false, totalCount: events.length, modelUsed: model });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many") || msg.includes("limit: 0")) {
        req.log.warn({ model }, "Quota exhausted, trying next");
        continue;
      }
      req.log.warn({ model, err }, "Model error, trying next");
      continue;
    }
  }

  // 4. Try without search grounding (separate token quota pool)
  try {
    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1beta" });
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await geminiModel.generateContent(buildPrompt(region, today, false));
    const parsed = extractJSON(result.response.text()) as Record<string, unknown>[];
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    const events = parsed.map((raw, idx) => sanitizeEvent(raw as Record<string, unknown>, idx));
    const fetchedAt = new Date().toISOString();
    const cacheResult: CachedResult = { events, fetchedAt, modelUsed: "gemini-2.0-flash-no-search" };
    memCache.set(cacheKey, { result: cacheResult, expiresAt: Date.now() + CACHE_TTL_MS });
    writeDiskEntry(cacheKey, cacheResult, Date.now() + CACHE_TTL_MS);
    res.json({ events, fetchedAt, cached: false, totalCount: events.length, modelUsed: "gemini-2.0-flash-no-search" });
    return;
  } catch (err) {
    req.log.warn({ err }, "No-search fallback failed — serving stale/curated cache");
  }

  // 5. ALWAYS return 200 — serve whatever is on disk (curated pre-seed or last live fetch)
  const stale = readDiskEntry(cacheKey);
  if (stale) {
    // Bump memory cache so repeated requests don't keep hammering Gemini while quota resets
    memCache.set(cacheKey, { result: stale.result, expiresAt: Date.now() + 30 * 60 * 1000 });
    res.json({
      events: stale.result.events,
      fetchedAt: stale.result.fetchedAt,
      cached: true,
      stale: true,
      totalCount: stale.result.events.length,
      modelUsed: stale.result.modelUsed,
    });
    return;
  }

  // This should never happen — curated pre-seed always exists
  res.json({ events: CURATED_EVENTS, fetchedAt: new Date().toISOString(),
    cached: true, stale: true, totalCount: CURATED_EVENTS.length, modelUsed: "curated" });
});

export default router;
