import type { WpPost } from "@/lib/graphql";
import { PAGE_SIZE, addDays, londonTodayIso, postDateKey, rankTips } from "@/lib/footballHub";

// -----------------------------------------------------------------------------
// Tip lists for league, country and sport category pages.
//
// Same rule as the /football/ hub: the HTML is the page. These pages used to
// ship every tip in the category (past and future) and let DateRail hide all
// but one date in the browser. Now the build renders the default view
// directly, today's and upcoming tips grouped by date, PAGE_SIZE per page,
// with /{category}/page/N/ for the rest. The date rail becomes jump links to
// each date's group, so nothing depends on JS and nothing is hidden.
// -----------------------------------------------------------------------------

export const CATEGORY_PAGE_SIZE = PAGE_SIZE;
export const JUMP_RAIL_DAYS = 7;

export type TipList = {
  // "upcoming": today and later. "recent": nothing upcoming, so the most
  // recent day with tips (keeps the page from rendering empty).
  mode: "upcoming" | "recent" | "empty";
  posts: WpPost[];
};

function byDateThenRank(posts: WpPost[]): WpPost[] {
  const groups = new Map<string, WpPost[]>();
  for (const post of posts) {
    const key = postDateKey(post);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(post);
  }
  return [...groups.keys()].sort().flatMap((key) => rankTips(groups.get(key)!));
}

export function buildTipList(posts: WpPost[], today = londonTodayIso()): TipList {
  const seen = new Set<string>();
  const unique = posts.filter((post) => {
    if (seen.has(post.slug)) return false;
    seen.add(post.slug);
    return true;
  });

  const upcoming = unique.filter((post) => {
    const key = postDateKey(post);
    return key !== null && key >= today;
  });
  if (upcoming.length) return { mode: "upcoming", posts: byDateThenRank(upcoming) };

  let latest = "";
  for (const post of unique) {
    const key = postDateKey(post);
    if (key && key < today && key > latest) latest = key;
  }
  if (!latest) return { mode: "empty", posts: [] };
  return { mode: "recent", posts: byDateThenRank(unique.filter((post) => postDateKey(post) === latest)) };
}

export function categoryPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
}

export function categoryPagePath(baseUri: string, page: number): string {
  const base = baseUri.endsWith("/") ? baseUri : `${baseUri}/`;
  return page <= 1 ? base : `${base}page/${page}/`;
}

export function dateAnchor(isoDate: string): string {
  return `d-${isoDate}`;
}

// Rail entries for the next JUMP_RAIL_DAYS days. A date with tips links to its
// group, on whichever page that group starts.
export function jumpRailLinks(list: TipList, baseUri: string, currentPage: number, today = londonTodayIso()) {
  const firstIndex = new Map<string, number>();
  list.posts.forEach((post, i) => {
    const key = postDateKey(post);
    if (key && !firstIndex.has(key)) firstIndex.set(key, i);
  });

  return Array.from({ length: JUMP_RAIL_DAYS }, (_, offset) => {
    const date = addDays(today, offset);
    const index = firstIndex.get(date);
    if (index === undefined) return { date, offset, href: null as string | null };
    const page = Math.floor(index / CATEGORY_PAGE_SIZE) + 1;
    const href = page === currentPage ? `#${dateAnchor(date)}` : `${categoryPagePath(baseUri, page)}#${dateAnchor(date)}`;
    return { date, offset, href };
  });
}
