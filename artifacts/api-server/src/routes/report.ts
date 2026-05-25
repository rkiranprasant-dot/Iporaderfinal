import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";

const router = Router();

const REPORT_SYSTEM_PROMPT = `You are an elite quantitative research analyst and primary markets data engineer specializing in global IPO markets. Generate a comprehensive Global IPO Intelligence Report covering material initial public offering events across all major exchanges.

Coverage scope:
- North America: NYSE, Nasdaq (Global Select, Global Market, Capital Market), TSX, TSX Venture
- UK & Europe: LSE, AIM, Euronext (Paris, Amsterdam, Brussels, Dublin, Oslo, Milan), Deutsche Börse (Frankfurt, Scale), SIX Swiss
- East Asia: HKEX (Main Board and GEM), SSE, SZSE, TSE, TWSE, SGX, KOSPI/KOSDAQ
- South Asia: BSE and NSE Mainboard AND SME platforms (BSE SME, NSE Emerge)
- Middle East & Africa: ADX, DFM, Tadawul, Boursa Kuwait, Muscat Stock Exchange
- Oceania: ASX, NZX

For each IPO event include:
- Company name, exchange, ticker symbol
- Event classification (S-1 Filed / Pricing / Day 1 Listing / Book Building / SPAC / Direct Listing / Uplisting / Allotment / Withdrawal / Market Rumor)
- Deal mechanics: raise size in local currency and USD equivalent, offer price/price band, post-money valuation
- Subscription data: QIB/NII/Retail multiples, Grey Market Premium (GMP), Day 1 trading vs offer price
- Lead bookrunners and legal counsel
- 2-3 sentence operational summary with financial context

Format output in Markdown with clear headers. Structure:
1. ## Global Activity Dashboard (summary table)
2. Regional sections with full company profiles
3. ## SME Market Table (BSE SME / NSE Emerge)
4. ## Week Ahead Pipeline Intelligence

DATA INTEGRITY RULES:
- Mark unavailable metrics as "Not Available in Public Sources"
- Label market rumors explicitly
- Use exact figures (e.g. "21.43x"), never vague qualifiers ("strong demand")
- If an exchange has no activity, state "[Exchange]: No material activity in this window"`;

router.post("/generate", async (req, res) => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Google API key not configured" });
    return;
  }

  try {
    const body = req.body as { region?: string; focus?: string };
    const { region, focus } = body;

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: REPORT_SYSTEM_PROMPT,
    });

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const scope = region ? `the ${region} region` : "all major global exchanges";
    const focusNote = focus ? ` Pay particular attention to: ${focus}.` : "";

    const userPrompt = `Generate a Global IPO Intelligence Report for ${scope} covering the 48-hour window ending today, ${today}.${focusNote}

Include all mandatory sections. For any exchange or region with zero activity, explicitly note it. Use precise figures and institutional-grade formatting throughout.`;

    const result = await model.generateContent(userPrompt);
    const content = result.response.text();

    res.json({
      content,
      generatedAt: new Date().toISOString(),
      region: region ?? "Global",
    });
  } catch (err) {
    req.log.error({ err }, "Report generation failed");
    res.status(500).json({ error: "Failed to generate report. Please try again." });
  }
});

export default router;
