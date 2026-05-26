import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";

const router = Router();

const MODELS = [
  { model: "gemini-2.5-pro",        apiVersion: "v1" as const,    grounded: true },
  { model: "gemini-2.0-flash",      apiVersion: "v1beta" as const, grounded: true },
  { model: "gemini-1.5-flash",      apiVersion: "v1beta" as const, grounded: true },
  { model: "gemini-2.0-flash-lite", apiVersion: "v1beta" as const, grounded: true },
  { model: "gemini-2.0-flash",      apiVersion: "v1beta" as const, grounded: false }, // no-search fallback
];

const REPORT_SYSTEM_PROMPT = `You are an elite quantitative research analyst specializing in global IPO markets. Generate a comprehensive Global IPO Intelligence Report.

Coverage: NYSE, Nasdaq, TSX, LSE, AIM, Euronext, Deutsche Börse, SIX, HKEX, SSE, SZSE, TSE, TWSE, SGX, KOSPI/KOSDAQ, BSE, NSE (Mainboard + SME), ADX, DFM, Tadawul, ASX, NZX.

For each deal include: company, exchange, ticker, event type, raise size in local + USD, offer price/band, post-money valuation, subscription multiples (QIB/NII/Retail), GMP, Day 1 performance, bookrunners, 2-3 sentence operational summary, and direct filing URL.

Structure output in Markdown:
1. ## Global Activity Dashboard (summary stats table)
2. Regional sections (North America / Europe / East Asia / South Asia / Middle East / Oceania)
3. ## Mega Deals & Market Movers ($1B+ raises, rumored unicorn listings like SpaceX, Stripe)
4. ## SME Market Pulse (BSE SME / NSE Emerge)
5. ## Week Ahead Pipeline

RULES: Mark unavailable metrics "N/A". Label rumors "⚠ UNVERIFIED". Use exact figures. State no-activity exchanges explicitly.`;

router.post("/generate", async (req, res) => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Google API key not configured" });
    return;
  }

  const body = req.body as { region?: string; focus?: string };
  const { region, focus } = body;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const scope = region ? `the ${region} region` : "all major global exchanges";
  const focusNote = focus ? ` Pay particular attention to: ${focus}.` : "";
  const userPrompt = `Generate a Global IPO Intelligence Report for ${scope} as of ${today}.${focusNote} Include all mandatory sections, Mega Deals & Market Movers, direct filing URLs, and note any zero-activity exchanges.`;

  for (const { model, apiVersion, grounded } of MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey, { apiVersion });
      const tools = grounded ? [{ googleSearch: {} }] : [];
      const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: REPORT_SYSTEM_PROMPT,
        tools,
      });
      const result = await geminiModel.generateContent(userPrompt);
      const content = result.response.text();
      res.json({
        content,
        generatedAt: new Date().toISOString(),
        region: region ?? "Global",
        modelUsed: grounded ? model : `${model} (no search)`,
      });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many")) {
        req.log.warn({ model, grounded }, "Report: quota exhausted, trying next");
        continue;
      }
      req.log.warn({ err, model }, "Report: model error, trying next");
      continue;
    }
  }

  res.status(429).json({
    error: "All AI models quota-limited. Gemini free tier resets at midnight Pacific. Try again in a few hours.",
  });
});

export default router;
