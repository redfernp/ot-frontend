// Today's strongest tips, as exported by the paul365 plugin (StrongTips.php)
// to /wp-content/uploads/oddstips-strong-tips.json. Fetched once per build and
// used for the "Today's strongest tips" band on the homepage and the football
// hub. If the file is missing or stale the band still renders, without picks.

import {
  WPGRAPHQL_ENDPOINT,
  WP_BASIC_AUTH_USER,
  WP_BASIC_AUTH_PASSWORD,
} from "astro:env/server";

export type StrongTip = {
  fixture: string;
  competition: string;
  kickoff: string;
  tip: string;
  odds: number | null;
  power: number;
  tipUrl: string | null;
};

export type StrongTipsFile = {
  date: string;
  markets: Record<string, { page: string; title: string; tips: StrongTip[] }>;
  accas: Record<string, { title: string; combinedOdds: number; power: number; legs: unknown[] }>;
};

// The six football tips pages, in display order.
export const STRONG_TIP_PAGES = [
  { market: "1x2", href: "/football-best-bets-today/", label: "Best Bets of the Day", blurb: "The strongest 1X2 bets our model can find today." },
  { market: "acca", href: "/football-acca-tips/", label: "Acca of the Day", blurb: "Our strongest selections combined into one acca." },
  { market: "btts", href: "/football-btts-tips/", label: "BTTS Tips", blurb: "Matches where both sides should find the net." },
  { market: "o25", href: "/football-over-2-5-goals-tips/", label: "Over 2.5 Goals", blurb: "Fixtures our model expects to have three goals or more." },
  { market: "o15", href: "/football-over-1-5-goals-tips/", label: "Over 1.5 Goals", blurb: "Games set for at least two goals." },
  { market: "cs", href: "/football-correct-score-tips/", label: "Correct Score Tips", blurb: "The most likely final scores, backed by xG." },
] as const;

let cached: Promise<StrongTipsFile | null> | null = null;

export function loadStrongTips(): Promise<StrongTipsFile | null> {
  if (!cached) cached = fetchStrongTips();
  return cached;
}

async function fetchStrongTips(): Promise<StrongTipsFile | null> {
  // Local dev only: STRONG_TIPS_FILE points at a sample export for previews.
  if (import.meta.env.DEV && process.env.STRONG_TIPS_FILE) {
    const fs = await import("node:fs");
    return JSON.parse(fs.readFileSync(process.env.STRONG_TIPS_FILE, "utf8")) as StrongTipsFile;
  }
  if (!WPGRAPHQL_ENDPOINT) return null;
  try {
    const url = new URL(WPGRAPHQL_ENDPOINT);
    url.pathname = "/wp-content/uploads/oddstips-strong-tips.json";
    url.search = `?cb=${Date.now()}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      // Same browser UA as the snapshot fetch; Imunify360 challenges bot UAs.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    };
    if (WP_BASIC_AUTH_USER && WP_BASIC_AUTH_PASSWORD) {
      headers.Authorization = `Basic ${btoa(`${WP_BASIC_AUTH_USER}:${WP_BASIC_AUTH_PASSWORD}`)}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const data = (await response.json()) as StrongTipsFile;
    return data && data.markets ? data : null;
  } catch {
    return null;
  }
}

// Only show picks dated today (UK) or later; an old file means no upload yet.
export function isCurrent(data: StrongTipsFile | null): data is StrongTipsFile {
  if (!data?.date) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  return data.date >= today;
}
