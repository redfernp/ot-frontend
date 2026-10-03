import type { WpPost } from "@/lib/graphql";
import { TRUE_INTERNATIONAL_SLUGS, getInternationalTips, postToWp } from "@/lib/graphql";
import { loadSnapshot, postsForCategory } from "@/lib/snapshot";

// -----------------------------------------------------------------------------
// Data for the /football/ hub.
//
// The hub used to ship every football tip in the snapshot (~1000 rows across
// ~11 days) and let DateRail hide everything except today in the browser. The
// raw HTML Google fetched and the rendered page were two different documents.
//
// Now the build decides what "today" shows: league tips for today's London
// date, ranked so the major leagues lead, first PAGE_SIZE rows in the HTML and
// the rest on /football/page/N/. Other dates are prebuilt as fragments under
// /data/football/{date}/ that the date rail fetches on click, so nothing is
// shipped hidden.
// -----------------------------------------------------------------------------

export const PAGE_SIZE = 40;
export const RAIL_DAYS_BEFORE = 1;
export const RAIL_DAYS_AFTER = 6;
export const FRAGMENT_BASE = "/data/football/";

const internationalSlugs = new Set(TRUE_INTERNATIONAL_SLUGS);

function londonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function londonDateKey(date: Date): string {
  const v = londonDateParts(date);
  return `${v.year}-${v.month}-${v.day}`;
}

export function londonTodayIso(): string {
  return londonDateKey(new Date());
}

export function addDays(isoDate: string, offset: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + offset));
  return d.toISOString().slice(0, 10);
}

export function railDates(today = londonTodayIso()): string[] {
  return Array.from({ length: RAIL_DAYS_BEFORE + RAIL_DAYS_AFTER + 1 }, (_, i) =>
    addDays(today, i - RAIL_DAYS_BEFORE),
  );
}

export function formatDayHeading(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

function kickoffMs(post: WpPost): number | null {
  if (!post.eventStart) return null;
  const t = new Date(post.eventStart).getTime();
  return Number.isFinite(t) ? t : null;
}

// Match day in UK time. eventStart is UTC, so a 00:30 BST kickoff belongs to
// the next London day even though its UTC date is the day before.
export function postDateKey(post: WpPost): string | null {
  const t = kickoffMs(post);
  return t === null ? null : londonDateKey(new Date(t));
}

function isInternational(post: WpPost): boolean {
  return (post.categories?.nodes ?? []).some((cat) => internationalSlugs.has(cat.slug));
}

// Deepest category (Sport > Country > League) is the league the tip belongs to.
function leagueUri(post: WpPost): string {
  let best = "";
  for (const cat of post.categories?.nodes ?? []) {
    const uri = cat.uri ?? "";
    if (uri.length > best.length) best = uri;
  }
  return best;
}

// Tier 0: the leagues most UK punters search for.
const MAJOR_LEAGUES = new Set([
  "/football/united-kingdom/england-premier-league/",
  "/football/united-kingdom/england-championship/",
  "/football/united-kingdom/scotland-premiership/",
  "/football/spain/spain-primera-liga/",
  "/football/italy/italy-serie-a/",
  "/football/germany/germany-bundesliga-i/",
  "/football/france/france-ligue-1/",
  "/football/holland/holland-eredivisie/",
  "/football/uefa/uefa-champions-league/",
  "/football/uefa/uefa-europa-league/",
  "/football/uefa/uefa-europa-conference-league/",
]);

// Tier 1: rest of UK & Ireland, UEFA qualifiers and the big five countries'
// lower divisions.
const SECOND_TIER_PREFIXES = [
  "/football/united-kingdom/",
  "/football/ireland/",
  "/football/uefa/",
  "/football/spain/",
  "/football/italy/",
  "/football/germany/",
  "/football/france/",
  "/football/portugal/",
  "/football/holland/",
];

// Reserve, youth and women's sides sort below senior men's football in the
// same tier. Matches "Admira II", "Lorient B"-style reserves, "U21", "W" and
// "Women".
const DEVELOPMENT_SIDE = /\b(?:II|III|U\d{2}|W|Women|Reserves)\b/;

export function leagueTier(post: WpPost): number {
  const uri = leagueUri(post);
  let tier = 2;
  if (MAJOR_LEAGUES.has(uri)) tier = 0;
  else if (SECOND_TIER_PREFIXES.some((prefix) => uri.startsWith(prefix))) tier = 1;
  if (DEVELOPMENT_SIDE.test(post.title ?? "")) tier += 1;
  return tier;
}

// Ranking for a day's list: games still to play first (a 12:30 kickoff that
// finished hours ago shouldn't sit at the top at 8pm), then league tier, then
// kickoff time.
export function rankTips(posts: WpPost[], now = Date.now()): WpPost[] {
  const finishedBefore = now - 2 * 60 * 60 * 1000;
  return [...posts].sort((a, b) => {
    const ta = kickoffMs(a) ?? Number.MAX_SAFE_INTEGER;
    const tb = kickoffMs(b) ?? Number.MAX_SAFE_INTEGER;
    const doneA = ta < finishedBefore ? 1 : 0;
    const doneB = tb < finishedBefore ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    const tierDiff = leagueTier(a) - leagueTier(b);
    if (tierDiff !== 0) return tierDiff;
    return ta - tb;
  });
}

// Every snapshot post filed under football, mapped to WpPost. Cached for the
// build because the hub, every pagination page and every date fragment read it.
let allFootballPosts: Promise<WpPost[]> | null = null;
function footballPosts(): Promise<WpPost[]> {
  if (!allFootballPosts) {
    allFootballPosts = (async () => {
      const snapshot = await loadSnapshot();
      return postsForCategory(snapshot, "football", Number.MAX_SAFE_INTEGER).map(postToWp);
    })();
  }
  return allFootballPosts;
}

// League (non-international) tips for one London match day, ranked. The same
// list feeds the hub, /football/page/N/ and the date fragment, so all three
// always agree on order.
export async function getLeagueTipsForDate(isoDate: string): Promise<WpPost[]> {
  const posts = await footballPosts();
  const seen = new Set<string>();
  const day = posts.filter((post) => {
    if (seen.has(post.slug)) return false;
    seen.add(post.slug);
    return postDateKey(post) === isoDate && !isInternational(post);
  });
  return rankTips(day);
}

// Every upcoming international fixture inside the rail window, soonest first.
export async function getUpcomingInternationals(): Promise<WpPost[]> {
  const lastDay = addDays(londonTodayIso(), RAIL_DAYS_AFTER);
  const posts = await getInternationalTips(500);
  return posts.filter((post) => {
    const key = postDateKey(post);
    return key !== null && key <= lastDay;
  });
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pagePath(page: number): string {
  return page <= 1 ? "/football/" : `/football/page/${page}/`;
}
