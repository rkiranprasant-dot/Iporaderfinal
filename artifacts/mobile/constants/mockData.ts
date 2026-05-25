export type EventType =
  | "S1_FILED"
  | "PRICING"
  | "DAY1_LISTING"
  | "BOOK_BUILDING"
  | "SPAC"
  | "DIRECT_LISTING"
  | "UPLISTING"
  | "ALLOTMENT"
  | "WITHDRAWAL"
  | "RUMOR";

export type Region =
  | "NORTH_AMERICA"
  | "EUROPE"
  | "EAST_ASIA"
  | "SOUTH_ASIA"
  | "MIDDLE_EAST"
  | "OCEANIA";

export interface IPOEvent {
  id: string;
  company: string;
  ticker?: string;
  exchange: string;
  region: Region;
  sector: string;
  eventType: EventType;
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

export const MOCK_IPO_EVENTS: IPOEvent[] = [
  {
    id: "na-001",
    company: "Klarna Group plc",
    ticker: "KLAR",
    exchange: "Nasdaq Global Select",
    region: "NORTH_AMERICA",
    sector: "Fintech / BNPL",
    eventType: "S1_FILED",
    raiseAmountUSD: "$1.23B",
    postMoneyValuation: "$14.9B",
    filingDate: "2025-05-24",
    leadBookrunners: ["Goldman Sachs", "JPMorgan", "Morgan Stanley"],
    summary:
      "Swedish BNPL giant Klarna filed its S-1 with the SEC targeting a Nasdaq listing. The company reported revenue of $2.81B in FY2024 (+24% YoY) and returned to net profitability at $21M. The filing discloses 93M active consumers across 45 markets.",
    source: "SEC EDGAR S-1 Filing, 24 May 2025",
  },
  {
    id: "na-002",
    company: "Cerebras Systems Inc.",
    ticker: "CBRS",
    exchange: "Nasdaq Global Market",
    region: "NORTH_AMERICA",
    sector: "AI Hardware / Semiconductors",
    eventType: "PRICING",
    raiseAmountUSD: "$900M",
    offerPrice: "$36.00",
    priceBand: "$34.00–$37.00",
    postMoneyValuation: "$7.1B",
    leadBookrunners: ["Citigroup", "Barclays", "Deutsche Bank"],
    listingDate: "2025-05-27",
    summary:
      "AI chip company Cerebras priced at the top of its range at $36/sh, raising $900M. The company's Wafer Scale Engine 3 is deployed by over 40 enterprise customers. FY2024 revenue was $136.4M (+212% YoY) with negative EBITDA margin of -18%.",
    source: "SEC EDGAR 424B4, 24 May 2025",
  },
  {
    id: "na-003",
    company: "StubHub Holdings Inc.",
    ticker: "STUB",
    exchange: "NYSE",
    region: "NORTH_AMERICA",
    sector: "Ticketing / Marketplace",
    eventType: "DAY1_LISTING",
    raiseAmountUSD: "$1.4B",
    offerPrice: "$28.00",
    day1Performance: 14.2,
    postMoneyValuation: "$16.5B",
    leadBookrunners: ["Goldman Sachs", "BofA Securities", "Allen & Company"],
    listingDate: "2025-05-25",
    summary:
      "StubHub opened trading at $31.97, a 14.2% premium to its $28 offer price, closing at $31.98 on volume of 42.7M shares. The company reported GMV of $6.4B in FY2024 (+19% YoY). Revenue was $1.67B with adjusted EBITDA margin of 34%.",
    source: "NYSE Trade Data, Bloomberg Terminal, 25 May 2025",
  },
  {
    id: "eu-001",
    company: "Flix SE",
    ticker: "FLX",
    exchange: "Deutsche Börse Scale",
    region: "EUROPE",
    sector: "Intercity Mobility / Transport",
    eventType: "PRICING",
    raiseAmountUSD: "$534M",
    raiseAmountLocal: "€490M",
    offerPrice: "€24.00",
    priceBand: "€22.00–€25.00",
    postMoneyValuation: "$2.3B",
    leadBookrunners: ["Deutsche Bank", "BNP Paribas", "Berenberg"],
    listingDate: "2025-05-27",
    summary:
      "Flix SE, operator of FlixBus and FlixTrain, priced its IPO at €24/sh raising €490M for European expansion. FY2024 revenue was €2.1B (+31% YoY). The company carried 72M passengers in 2024 across 40 countries.",
    source: "Deutsche Börse RNS, Prospectus Filing, 24 May 2025",
  },
  {
    id: "eu-002",
    company: "Monzo Bank Ltd",
    ticker: "MON",
    exchange: "LSE AIM",
    region: "EUROPE",
    sector: "Digital Banking / Neobank",
    eventType: "BOOK_BUILDING",
    raiseAmountUSD: "$1.1B",
    raiseAmountLocal: "£850M",
    priceBand: "£4.20–£4.80",
    postMoneyValuation: "$6.2B",
    subscriptionOverall: 3.84,
    subscriptionQIB: 5.21,
    leadBookrunners: ["Jefferies", "Numis Securities"],
    summary:
      "Monzo's AIM book-build closed 3.84x oversubscribed, with QIB tranche 5.21x covered. The UK challenger bank reported 9.7M UK customers and revenue of £880M in FY2024 (+51% YoY), with its first full-year profit of £15.4M.",
    source: "LSE RNS Announcement, Jefferies Bookrunner Report, 24 May 2025",
  },
  {
    id: "ea-001",
    company: "ByteDance Cloud Technology",
    ticker: "9985",
    exchange: "HKEX Main Board",
    region: "EAST_ASIA",
    sector: "Cloud Computing / AI Infrastructure",
    eventType: "S1_FILED",
    raiseAmountUSD: "$4.5B",
    raiseAmountLocal: "HKD 35.1B",
    postMoneyValuation: "$35.9B",
    filingDate: "2025-05-23",
    leadBookrunners: ["CICC", "Goldman Sachs (Asia)", "Morgan Stanley"],
    summary:
      "ByteDance's cloud and enterprise AI subsidiary filed a DRHP with HKEX targeting a Main Board listing. The unit operates Volcano Engine cloud platform serving 4.2M enterprise clients. Revenue was RMB 48.3B in FY2024 with 42% YoY growth.",
    source: "HKEX Listing Document DRHP, 23 May 2025",
  },
  {
    id: "ea-002",
    company: "SoftBank AI Capital KK",
    ticker: "9438",
    exchange: "TSE Prime Market",
    region: "EAST_ASIA",
    sector: "AI Investment / Venture Capital",
    eventType: "BOOK_BUILDING",
    raiseAmountLocal: "¥420B",
    raiseAmountUSD: "$2.77B",
    priceBand: "¥1,800–¥2,100",
    postMoneyValuation: "$18.4B",
    subscriptionQIB: 12.44,
    subscriptionRetail: 8.71,
    subscriptionOverall: 11.23,
    leadBookrunners: ["Nomura Securities", "Daiwa Securities", "SMBC Nikko"],
    summary:
      "SoftBank's dedicated AI investment vehicle priced its book-build 11.23x oversubscribed. The entity holds stakes in 47 AI companies including Arm Japan holdings. AUM of $41.2B with projected 5-year IRR of 28%.",
    source: "TSE Disclosure, Nomura Bookrunner Report, 24 May 2025",
  },
  {
    id: "ea-003",
    company: "Grab Financial Group",
    ticker: "GFG",
    exchange: "SGX Mainboard",
    region: "EAST_ASIA",
    sector: "Digital Financial Services",
    eventType: "DIRECT_LISTING",
    raiseAmountUSD: "$580M",
    raiseAmountLocal: "SGD 785M",
    postMoneyValuation: "$4.2B",
    day1Performance: 6.8,
    leadBookrunners: ["DBS Bank", "UOB Kay Hian"],
    listingDate: "2025-05-25",
    summary:
      "Grab Financial's SGX direct listing debuted at SGD 2.14, +6.8% above reference price. The entity processed SGD 42.1B in payments in FY2024 with 38M active wallet users across Southeast Asia. Net revenue was SGD 1.2B (+44% YoY).",
    source: "SGX Trade Data, MAS Prospectus Filing, 25 May 2025",
  },
  {
    id: "sa-001",
    company: "Zepto Ecommerce Pvt Ltd",
    ticker: "ZEPTO",
    exchange: "NSE / BSE Mainboard",
    region: "SOUTH_ASIA",
    sector: "Quick Commerce / D2C",
    eventType: "S1_FILED",
    raiseAmountLocal: "₹8,500 Cr",
    raiseAmountUSD: "$1.02B",
    postMoneyValuation: "$5.04B",
    filingDate: "2025-05-22",
    leadBookrunners: ["Kotak Mahindra Capital", "ICICI Securities", "Goldman Sachs India"],
    summary:
      "Quick commerce unicorn Zepto filed its DRHP with SEBI targeting a dual listing on NSE and BSE. The company operates 700+ dark stores across 20 Indian cities. GMV grew 104% YoY to ₹24,800 Cr in FY2024, with EBITDA losses narrowing to -₹320 Cr.",
    source: "SEBI DRHP Filing, BSE Portal, 22 May 2025",
  },
  {
    id: "sa-002",
    company: "PhysicsWallah Pvt Ltd",
    ticker: "PHYSICS",
    exchange: "NSE / BSE Mainboard",
    region: "SOUTH_ASIA",
    sector: "EdTech / Online Education",
    eventType: "PRICING",
    raiseAmountLocal: "₹3,200 Cr",
    raiseAmountUSD: "$384M",
    priceBand: "₹1,050–₹1,120",
    postMoneyValuation: "$2.8B",
    subscriptionQIB: 28.34,
    subscriptionNII: 41.17,
    subscriptionRetail: 12.89,
    subscriptionOverall: 27.43,
    gmp: "₹180 (premium)",
    leadBookrunners: ["JM Financial", "Axis Capital", "Motilal Oswal"],
    listingDate: "2025-05-28",
    summary:
      "Edtech platform PhysicsWallah priced at ₹1,120 (top of band) with 27.43x overall subscription. QIB tranche 28.34x covered. Revenue was ₹2,840 Cr in FY2024 (+68% YoY) with EBITDA of ₹310 Cr. GMP of ₹180 implies listing premium of ~16%.",
    source: "BSE/NSE Subscription Data, SEBI Filing, 24 May 2025",
  },
  {
    id: "sa-003",
    company: "Ola Electric Mobility Ltd",
    ticker: "OLA",
    exchange: "NSE / BSE Mainboard",
    region: "SOUTH_ASIA",
    sector: "Electric Vehicles",
    eventType: "DAY1_LISTING",
    raiseAmountLocal: "₹6,145 Cr",
    raiseAmountUSD: "$737M",
    offerPrice: "₹76",
    day1Performance: 16.3,
    postMoneyValuation: "$5.4B",
    subscriptionOverall: 4.27,
    leadBookrunners: ["Kotak Mahindra Capital", "BofA Securities India", "Citigroup India"],
    listingDate: "2025-05-25",
    summary:
      "EV manufacturer Ola Electric listed at ₹88.30, a 16.3% premium to its ₹76 offer price, closing at ₹87.92. The company sold 430,000 electric scooters in FY2024. Revenue was ₹5,243 Cr with operating losses of -₹1,528 Cr, reflecting heavy capex investment.",
    source: "NSE/BSE Trade Data, Bloomberg, 25 May 2025",
  },
  {
    id: "sa-004",
    company: "Bharat FIH Ltd",
    ticker: "BFIH",
    exchange: "BSE SME",
    region: "SOUTH_ASIA",
    sector: "Electronics Manufacturing / EMS",
    eventType: "BOOK_BUILDING",
    raiseAmountLocal: "₹1,240 Cr",
    raiseAmountUSD: "$149M",
    priceBand: "₹115–₹122",
    lotSize: 1200,
    subscriptionQIB: 38.12,
    subscriptionNII: 52.44,
    subscriptionRetail: 21.73,
    subscriptionOverall: 34.88,
    gmp: "₹45 (premium)",
    leadBookrunners: ["HDFC Bank Securities", "IIFL Securities"],
    summary:
      "EMS company Bharat FIH (a Foxconn affiliate) closed Day 3 subscription at 34.88x overall. QIB tranche 38.12x covered, NII 52.44x. Revenue was ₹4,890 Cr in FY2024, manufacturing components for Apple, Samsung. GMP of ₹45 signals 36.9% listing premium.",
    source: "BSE SME Subscription Data, 24 May 2025",
  },
  {
    id: "sa-005",
    company: "Vraj Iron & Steel Ltd",
    ticker: "VRAJ",
    exchange: "BSE SME",
    region: "SOUTH_ASIA",
    sector: "Steel / Metal Manufacturing",
    eventType: "ALLOTMENT",
    raiseAmountLocal: "₹171 Cr",
    raiseAmountUSD: "$20.5M",
    offerPrice: "₹207",
    lotSize: 600,
    subscriptionQIB: 78.34,
    subscriptionNII: 91.22,
    subscriptionRetail: 42.17,
    subscriptionOverall: 47.23,
    gmp: "₹82 (premium)",
    listingDate: "2025-05-28",
    leadBookrunners: ["Pantomath Capital Advisors"],
    summary:
      "Allotment finalized for Vraj Iron & Steel at ₹207/sh with 47.23x overall subscription. QIB 78.34x, NII 91.22x. GMP of ₹82 implies ₹289 listing price, a 39.6% premium. Company operates a 1.2 MT steel plant in Chhattisgarh with ₹1,450 Cr FY2024 revenue.",
    source: "BSE Allotment Data, Registrar Report, 24 May 2025",
  },
  {
    id: "me-001",
    company: "Aramco Trading Company",
    ticker: "2231",
    exchange: "Tadawul (Saudi Exchange)",
    region: "MIDDLE_EAST",
    sector: "Energy Trading / Commodities",
    eventType: "BOOK_BUILDING",
    raiseAmountLocal: "SAR 12.5B",
    raiseAmountUSD: "$3.33B",
    priceBand: "SAR 42.00–SAR 47.00",
    postMoneyValuation: "$16.8B",
    subscriptionQIB: 6.42,
    subscriptionOverall: 5.18,
    leadBookrunners: ["Saudi Fransi Capital", "Goldman Sachs Saudi Arabia", "HSBC Saudi Arabia"],
    summary:
      "Aramco's dedicated energy trading subsidiary opened its institutional book-build 5.18x oversubscribed on Day 2. The entity trades crude, refined products, and LNG across 32 countries. FY2024 trading volumes of $89.4B with net margin of 8.2%.",
    source: "Tadawul Exchange Notice, Saudi CMA Filing, 24 May 2025",
  },
  {
    id: "me-002",
    company: "Aldar Living REIT",
    ticker: "ALDAR-R",
    exchange: "DFM (Dubai Financial Market)",
    region: "MIDDLE_EAST",
    sector: "Real Estate / Residential REIT",
    eventType: "PRICING",
    raiseAmountLocal: "AED 3.2B",
    raiseAmountUSD: "$871M",
    offerPrice: "AED 1.88",
    postMoneyValuation: "$2.4B",
    subscriptionOverall: 9.31,
    leadBookrunners: ["Emirates NBD Capital", "First Abu Dhabi Bank Securities"],
    listingDate: "2025-05-28",
    summary:
      "Aldar Living REIT priced at AED 1.88/unit with 9.31x overall subscription. The REIT holds 18,400 residential units across Abu Dhabi and Dubai with AED 12.3B total asset value. Projected FY2025 distribution yield of 7.2% based on offer price.",
    source: "DFM Prospectus, SCA Regulatory Filing, 24 May 2025",
  },
  {
    id: "oc-001",
    company: "Canva Pty Ltd",
    exchange: "ASX (Australian Securities Exchange)",
    region: "OCEANIA",
    sector: "SaaS / Design Technology",
    eventType: "RUMOR",
    postMoneyValuation: "$39B",
    summary:
      "Market Rumor (Source: The Australian Financial Review, 24 May 2025): Canva is reportedly exploring a dual ASX/Nasdaq listing targeting a $39B valuation. Co-founders confirmed confidential advisors engaged but declined to specify timeline. No ASIC filing has been made.",
    source: "AFR Market Intelligence, 24 May 2025 — UNVERIFIED MARKET RUMOR",
  },
  {
    id: "oc-002",
    company: "Nuix Technology Ltd",
    ticker: "NXL",
    exchange: "ASX (Australian Securities Exchange)",
    region: "OCEANIA",
    sector: "Legal Tech / Data Intelligence",
    eventType: "UPLISTING",
    raiseAmountUSD: "$124M",
    raiseAmountLocal: "A$185M",
    offerPrice: "A$4.20",
    postMoneyValuation: "$1.54B",
    day1Performance: 8.9,
    leadBookrunners: ["UBS Australia", "Macquarie Capital"],
    listingDate: "2025-05-25",
    summary:
      "Nuix completed its uplisting from ASX:Emerging to ASX:300 with a A$185M placement at A$4.20, gaining A$2.1B market cap inclusion. Day 1 performance +8.9%. Revenue grew 34% YoY to A$312M in FY2024 with EBITDA margin improving to 28%.",
    source: "ASX Listing Notice, Nuix ASX:NXL Announcement, 25 May 2025",
  },
];

export const REGION_LABELS: Record<Region, string> = {
  NORTH_AMERICA: "North America",
  EUROPE: "Europe",
  EAST_ASIA: "East Asia",
  SOUTH_ASIA: "South Asia",
  MIDDLE_EAST: "Middle East",
  OCEANIA: "Oceania",
};

export const REGION_COLORS: Record<Region, string> = {
  NORTH_AMERICA: "#3b82f6",
  EUROPE: "#8b5cf6",
  EAST_ASIA: "#ef4444",
  SOUTH_ASIA: "#f97316",
  MIDDLE_EAST: "#22c55e",
  OCEANIA: "#06b6d4",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  S1_FILED: "S-1 Filed",
  PRICING: "Priced",
  DAY1_LISTING: "Day 1",
  BOOK_BUILDING: "Book Building",
  SPAC: "SPAC",
  DIRECT_LISTING: "Direct Listing",
  UPLISTING: "Uplisting",
  ALLOTMENT: "Allotment",
  WITHDRAWAL: "Withdrawn",
  RUMOR: "Market Rumor",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  S1_FILED: "#3b82f6",
  PRICING: "#8b5cf6",
  DAY1_LISTING: "#eab308",
  BOOK_BUILDING: "#f97316",
  SPAC: "#06b6d4",
  DIRECT_LISTING: "#14b8a6",
  UPLISTING: "#6366f1",
  ALLOTMENT: "#22c55e",
  WITHDRAWAL: "#ef4444",
  RUMOR: "#94a3b8",
};

export const REGIONS: Region[] = [
  "NORTH_AMERICA",
  "EUROPE",
  "EAST_ASIA",
  "SOUTH_ASIA",
  "MIDDLE_EAST",
  "OCEANIA",
];
