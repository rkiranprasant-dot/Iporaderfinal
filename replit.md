# IPO Intelligence

A professional-grade mobile app for institutional investors to track global IPO activity across 30+ exchanges, with AI-powered report generation using Google Gemini.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — Postgres connection string (not currently used)
- Required env: `GOOGLE_API_KEY` — Gemini AI key for report generation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- API: Express 5
- AI: Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/` — Expo React Native app
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `artifacts/mobile/constants/mockData.ts` — 17 IPO events across all global regions
- `artifacts/mobile/context/WatchlistContext.tsx` — AsyncStorage watchlist state
- `artifacts/api-server/src/routes/report.ts` — Gemini AI report generation route

## Architecture decisions

- All IPO data is mock data in `constants/mockData.ts` — no database needed for the first build
- Both `light` and `dark` color palettes use the same dark financial theme
- AI report generation is server-side only (API key never exposed to client)
- The `setBaseUrl` call in `_layout.tsx` ensures Expo can reach the API server via absolute URL
- Gemini `gemini-2.0-flash` model used for fast report generation

## Product

- **Dashboard**: Global activity overview with stats, regional breakdown, and featured deals
- **IPO Feed**: Filterable, searchable feed of all 17 tracked IPO events across 6 regions
- **Intelligence Report**: AI-generated Global IPO Intelligence Report via Gemini, scoped by region
- **Watchlist**: Bookmark any IPO event; persisted in AsyncStorage
- **Company Detail**: Full institutional-grade company profile with deal mechanics, subscription data, underwriters

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before using new hooks
- Restart the API server workflow after modifying server routes
- Mobile app has HMR — only restart the mobile workflow for dependency changes or Metro errors

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
