// Snapshot loader. The Oddstips Snapshot WordPress plugin dumps every category,
// post, and page into a single JSON file at /wp-content/uploads/tips-snapshot.json.
// This module fetches that file once per build, caches it in module state, and
// exposes accessor helpers that mirror the shape WPGraphQL used to return.
//
// All the static-build code in [...path].astro and the static-data helpers in
// graphql.ts read from this module instead of making hundreds of GraphQL calls
// against the 2GB Cloudways WP backend. Result: build time drops from ~15
// minutes to <2 minutes and WP gets touched exactly once per build.

import {
  WPGRAPHQL_ENDPOINT,
  WP_BASIC_AUTH_USER,
  WP_BASIC_AUTH_PASSWORD,
} from "astro:env/server";
import { cleanSlug, fixDoubleEncoded, hasMojibake } from "@/lib/slugSanitize";

// -----------------------------------------------------------------------------
// Types — shaped to match the WpPost / WpCategory / WpMenu types in graphql.ts
// so consumers don't need to change their field accesses.
// -----------------------------------------------------------------------------

export type SnapshotSeo = {
  title?: string;
  metaDesc?: string;
  canonical?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: { sourceUrl?: string } | null;
  twitterTitle?: string;
  twitterDescription?: string;
  // True if Yoast resolved this post/page/term to noindex (either via a
  // per-item override or by inheriting the global content-type setting).
  // The Astro frontend renders a `<meta name="robots" content="noindex, follow">`
  // tag for these and skips the self-referencing canonical fallback.
  noindex?: boolean;
};

export type SnapshotCategoryNode = {
  id: string;
  databaseId: number;
  slug: string;
  uri?: string;
  name?: string;
};

export type SnapshotCategory = {
  id: string;
  databaseId: number;
  parentId: number;
  slug: string;
  uri: string;
  name: string;
  description: string;
  count: number;
  seo: SnapshotSeo;
  categoryTopSeoText: { categoryTopSeoText: string };
  categoryBottomSeoText: { categoryBottomSeoText: string };
};

export type SnapshotPost = {
  id: string;
  databaseId: number;
  slug: string;
  uri: string;
  title: string;
  excerpt?: string;
  content?: string;
  date: string;
  modified?: string;
  // Actual fixture kickoff time written by paul365 cron-runner as post_meta
  // 'event_start'. Used for date-rail filtering / date-grouped lists. Null
  // for non-tip posts (about, articles).
  eventStart?: string | null;
  seo: SnapshotSeo;
  categories: { nodes: SnapshotCategoryNode[] };
};

export type SnapshotPage = {
  id: string;
  databaseId: number;
  slug: string;
  uri: string;
  title: string;
  content?: string;
  modified?: string;
  seo: SnapshotSeo;
};

export type Snapshot = {
  generatedAt: string;
  categories: SnapshotCategory[];
  posts: SnapshotPost[];
  pages: SnapshotPage[];
};

// -----------------------------------------------------------------------------
// Loader — fetches the snapshot once per build, caches in module state.
// -----------------------------------------------------------------------------

// Health-check thresholds. If the loaded snapshot has fewer categories OR
// fewer posts than these, we treat the snapshot as broken and FAIL THE BUILD.
// This is the guardrail that prevents a bad snapshot fetch (Imunify360
// bot-blocking, WP down, file corrupted, etc.) from silently deploying a
// 32-page site that overwrites the previous healthy ~3900-page deploy.
// Tune these only if the real site genuinely drops below these counts.
const MIN_HEALTHY_CATEGORIES = 100;
const MIN_HEALTHY_POSTS = 100;

let snapshotPromise: Promise<Snapshot | null> | null = null;

function snapshotUrl(): string | null {
  // Derive the snapshot URL from WPGRAPHQL_ENDPOINT. We assume the WP install
  // lives at https://example.com/graphql, so the snapshot lives at
  // https://example.com/wp-content/uploads/tips-snapshot.json on the same host.
  if (!WPGRAPHQL_ENDPOINT) return null;
  try {
    const base = new URL(WPGRAPHQL_ENDPOINT);
    base.pathname = "/wp-content/uploads/tips-snapshot.json";
    base.search = "";
    return base.toString();
  } catch {
    return null;
  }
}

function snapshotAuthHeader(): Record<string, string> {
  const user = WP_BASIC_AUTH_USER;
  const password = WP_BASIC_AUTH_PASSWORD;
  if (!user || !password) return {};
  return { Authorization: `Basic ${btoa(`${user}:${password}`)}` };
}

async function fetchSnapshot(): Promise<Snapshot | null> {
  const url = snapshotUrl();
  if (!url) {
    // No WP endpoint configured. Only legitimate for very first deploys
    // before the plugin is installed. We return null and the build will
    // produce minimal static pages, which is acceptable for that scenario.
    console.warn("[snapshot] No WPGRAPHQL_ENDPOINT set; snapshot unavailable. Build will produce minimal static pages.");
    return null;
  }

  // Add a cache-buster so any WP-side or CDN cache layer doesn't serve a
  // stale empty response. Use a real browser User-Agent so bot protection
  // (Imunify360 / WAFs) is less likely to challenge or block the request.
  // The previous "OddstipsBuild/1.0" UA tripped Imunify360 bot-protection
  // and caused a deploy that wiped 3900 pages — see the incident on
  // 2026-06-07 around 20:20 UTC for details.
  const cacheBuster = Date.now();
  const urlWithBuster = `${url}?cb=${cacheBuster}`;
  console.log(`[snapshot] Fetching ${urlWithBuster}`);
  const start = Date.now();

  const response = await fetch(urlWithBuster, {
    headers: {
      Accept: "application/json",
      ...snapshotAuthHeader(),
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  });

  const status = response.status;
  const contentType = response.headers.get("content-type") || "(none)";
  const contentLength = response.headers.get("content-length") || "(none)";
  const xCache = response.headers.get("x-cache") || "(none)";

  console.log(
    `[snapshot] Response: HTTP ${status}, content-type=${contentType}, content-length=${contentLength}, x-cache=${xCache}`,
  );

  if (!response.ok) {
    const body = await response.text();
    abortBuild(
      `[snapshot] FETCH FAILED: HTTP ${status}. Refusing to build a degraded site ` +
        `that would overwrite the existing healthy deploy. First 500 chars of body:\n${body.slice(0, 500)}`,
    );
  }

  const rawText = await response.text();
  const ms = Date.now() - start;

  let data: Snapshot;
  try {
    data = JSON.parse(rawText) as Snapshot;
  } catch (parseError) {
    abortBuild(
      `[snapshot] JSON PARSE FAILED: ${parseError instanceof Error ? parseError.message : String(parseError)}. ` +
        `Refusing to build. First 500 chars of body:\n${rawText.slice(0, 500)}`,
    );
  }

  const cats = data.categories?.length ?? 0;
  const posts = data.posts?.length ?? 0;
  const pages = data.pages?.length ?? 0;
  const sizeMb = (rawText.length / 1024 / 1024).toFixed(2);
  console.log(
    `[snapshot] Loaded in ${ms}ms: ${cats} categories, ${posts} posts, ${pages} pages (${sizeMb} MB)`,
  );

  // HEALTH CHECK. If the snapshot is suspiciously thin, abort the build so
  // CF Pages does not deploy a degraded site over the last healthy deploy.
  // Common causes: Imunify360 bot-protection returning a JSON error body,
  // WP down, snapshot file truncated, plugin not generating, etc.
  if (cats < MIN_HEALTHY_CATEGORIES || posts < MIN_HEALTHY_POSTS) {
    abortBuild(
      `[snapshot] HEALTH CHECK FAILED. Got ${cats} categories and ${posts} posts ` +
        `(thresholds: >= ${MIN_HEALTHY_CATEGORIES} categories AND >= ${MIN_HEALTHY_POSTS} posts). ` +
        `Refusing to build a degraded site that would overwrite the existing healthy deploy. ` +
        `First 500 chars of response body:\n${rawText.slice(0, 500)}`,
    );
  }

  normaliseMojibakeInPlace(data);

  return data;
}

// Mutate the snapshot so every URI / slug runs through the mojibake cleaner.
// Records every (broken -> clean) URI swap in `mojibakeRedirects` so the
// build-time integration can emit 301s for the legacy mangled URLs (Google
// likely still has them in its index from past crawls). Sub-category nodes
// hung off post.categories are also normalised so internal links rendered
// in the breadcrumb / related-tip components don't keep pointing at the
// broken paths.
//
// Also runs fixDoubleEncoded() over every human-readable text field
// (titles, names, content, ACF SEO copy, Yoast meta) to repair the
// separate double-encoded UTF-8 pattern responsible for `KÃ¸ge` style
// display mojibake. That bug shares a cause (cp1252 misdecoding in
// paul365's pipeline) but a different surface (the visible text rather
// than the URL-encoded slug bytes), so we run both fixes here in one
// pass to keep the snapshot's downstream consumers simple.
function normaliseMojibakeInPlace(data: Snapshot) {
  // Helper: only assign if the repair actually changed something, to keep
  // the snapshot identical-by-reference where there was no mojibake.
  const repair = (s: string | undefined | null): string | undefined => {
    if (!s) return s ?? undefined;
    const out = fixDoubleEncoded(s);
    return out === s ? s : out;
  };
  const repairSeo = (seo: SnapshotSeo | undefined) => {
    if (!seo) return;
    if (seo.title) seo.title = repair(seo.title)!;
    if (seo.metaDesc) seo.metaDesc = repair(seo.metaDesc)!;
    if (seo.opengraphTitle) seo.opengraphTitle = repair(seo.opengraphTitle)!;
    if (seo.opengraphDescription) seo.opengraphDescription = repair(seo.opengraphDescription)!;
    if (seo.twitterTitle) seo.twitterTitle = repair(seo.twitterTitle)!;
    if (seo.twitterDescription) seo.twitterDescription = repair(seo.twitterDescription)!;
  };

  let textRepairs = 0;

  for (const c of data.categories) {
    const before = c.uri;
    if (c.slug && hasMojibake(c.slug)) c.slug = cleanSlug(c.slug);
    if (c.uri && hasMojibake(c.uri)) c.uri = cleanSlug(c.uri);
    if (before && before !== c.uri) mojibakeRedirects.set(before, c.uri);

    if (c.name) {
      const cleaned = fixDoubleEncoded(c.name);
      if (cleaned !== c.name) { c.name = cleaned; textRepairs += 1; }
    }
    if (c.description) c.description = repair(c.description)!;
    if (c.categoryTopSeoText?.categoryTopSeoText) {
      c.categoryTopSeoText.categoryTopSeoText = repair(c.categoryTopSeoText.categoryTopSeoText)!;
    }
    if (c.categoryBottomSeoText?.categoryBottomSeoText) {
      c.categoryBottomSeoText.categoryBottomSeoText = repair(c.categoryBottomSeoText.categoryBottomSeoText)!;
    }
    repairSeo(c.seo);
  }

  for (const p of data.posts) {
    const before = p.uri;
    if (p.slug && hasMojibake(p.slug)) p.slug = cleanSlug(p.slug);
    if (p.uri && hasMojibake(p.uri)) p.uri = cleanSlug(p.uri);
    if (before && before !== p.uri) mojibakeRedirects.set(before, p.uri ?? "");
    if (p.categories?.nodes) {
      for (const node of p.categories.nodes) {
        if (node.slug && hasMojibake(node.slug)) node.slug = cleanSlug(node.slug);
        if (node.uri && hasMojibake(node.uri)) node.uri = cleanSlug(node.uri);
        if (node.name) {
          const cleaned = fixDoubleEncoded(node.name);
          if (cleaned !== node.name) { node.name = cleaned; textRepairs += 1; }
        }
      }
    }
    if (p.title) {
      const cleaned = fixDoubleEncoded(p.title);
      if (cleaned !== p.title) { p.title = cleaned; textRepairs += 1; }
    }
    if (p.excerpt) p.excerpt = repair(p.excerpt)!;
    if (p.content) p.content = repair(p.content)!;
    repairSeo(p.seo);
  }

  for (const p of data.pages) {
    const before = p.uri;
    if (p.slug && hasMojibake(p.slug)) p.slug = cleanSlug(p.slug);
    if (p.uri && hasMojibake(p.uri)) p.uri = cleanSlug(p.uri);
    if (before && before !== p.uri) mojibakeRedirects.set(before, p.uri ?? "");
    if (p.title) {
      const cleaned = fixDoubleEncoded(p.title);
      if (cleaned !== p.title) { p.title = cleaned; textRepairs += 1; }
    }
    if (p.content) p.content = repair(p.content)!;
    repairSeo(p.seo);
  }

  if (mojibakeRedirects.size > 0) {
    console.log(`[snapshot] Cleaned ${mojibakeRedirects.size} mojibake URIs to ASCII.`);
  }
  if (textRepairs > 0) {
    console.log(`[snapshot] Repaired ${textRepairs} double-encoded text fields (titles/names).`);
  }
}

// (broken URI -> clean URI). Populated during snapshot load, consumed by
// the redirects-emit integration in astro.config.mjs to generate 301
// entries in dist/_redirects so legacy mangled URLs in Google's index
// redirect to the clean equivalents instead of 404ing.
export const mojibakeRedirects = new Map<string, string>();

// Minimal local declaration for Node's process global so we don't need to
// pull in @types/node just for this one usage. `process.exit` is available
// at runtime because Astro's static build runs under Node.
declare const process: { exit(code: number): never };

// Hard-fail the build process. We use process.exit(1) rather than throwing
// because Astro catches errors thrown inside getStaticPaths per-page and
// falls back to hardcoded routes; the build still exits 0 and CF Pages
// happily deploys whatever stripped-down dist/ was produced. process.exit
// terminates the Node build process immediately with a non-zero code, so
// `npm run build` fails and CF Pages skips the deploy step entirely.
// This was learned the hard way on 2026-06-07 when a guardrail with throw
// "worked" (the error printed) but the broken 32-page build deployed anyway.
function abortBuild(message: string): never {
  console.error("\n\n========================================");
  console.error("BUILD ABORTED BY SNAPSHOT HEALTH CHECK");
  console.error("========================================");
  console.error(message);
  console.error("========================================\n\n");
  return process.exit(1);
}

export function loadSnapshot(): Promise<Snapshot | null> {
  if (!snapshotPromise) {
    snapshotPromise = fetchSnapshot();
  }
  return snapshotPromise;
}

// -----------------------------------------------------------------------------
// Accessors — pure functions over an already-loaded snapshot.
// -----------------------------------------------------------------------------

export function findCategoryBySlug(snapshot: Snapshot | null, slug: string): SnapshotCategory | null {
  if (!snapshot) return null;
  return snapshot.categories.find((c) => c.slug === slug) ?? null;
}

export function findPostBySlug(snapshot: Snapshot | null, slug: string): SnapshotPost | null {
  if (!snapshot) return null;
  return snapshot.posts.find((p) => p.slug === slug) ?? null;
}

export function findPageByUri(snapshot: Snapshot | null, uri: string): SnapshotPage | null {
  if (!snapshot) return null;
  const normalized = normalizeUri(uri);
  return snapshot.pages.find((p) => normalizeUri(p.uri) === normalized) ?? null;
}

function normalizeUri(uri: string): string {
  return "/" + uri.replace(/^\/+|\/+$/g, "") + "/";
}

// WordPress WYSIWYG fields can look non-empty while containing only editor
// scaffolding such as `<p><br></p>` or `&nbsp;`. Treat a category as having
// editorial content only when some visible text remains after removing that
// markup. This lets substantial evergreen league/category guides stay live
// between seasons without bringing back thin 200 pages for truly empty terms.
function htmlHasMeaningfulText(value: string | undefined | null): boolean {
  if (!value) return false;
  const visibleText = value
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, " ")
    .trim();
  return visibleText.length > 0;
}

export function categoryHasSeoContent(category: SnapshotCategory): boolean {
  return (
    htmlHasMeaningfulText(category.categoryTopSeoText?.categoryTopSeoText) ||
    htmlHasMeaningfulText(category.categoryBottomSeoText?.categoryBottomSeoText)
  );
}

// A category deserves a static route when it has current tips OR meaningful
// evergreen editorial copy. Previously only the first condition was used,
// causing high-value league pages to disappear as soon as retention removed
// their final out-of-season tip.
export function categoryHasRenderableContent(
  snapshot: Snapshot | null,
  category: SnapshotCategory,
): boolean {
  return (
    categoryHasSeoContent(category) ||
    postsForCategory(snapshot, category.slug, 1).length > 0
  );
}

// Filter posts that include a given category (by slug). Posts can belong to
// multiple categories, and parent-sport category pages (e.g. /football/) need
// to surface posts from any child sub-category, so this also checks if the
// post's category uri starts with the requested category's uri.
export function postsForCategory(
  snapshot: Snapshot | null,
  categorySlug: string,
  limit: number,
): SnapshotPost[] {
  if (!snapshot) return [];

  const targetCategory = findCategoryBySlug(snapshot, categorySlug);
  const targetUri = targetCategory?.uri ? normalizeUri(targetCategory.uri) : null;

  const matched: SnapshotPost[] = [];
  for (const post of snapshot.posts) {
    const nodes = post.categories?.nodes ?? [];
    const directHit = nodes.some((cat) => cat.slug === categorySlug);
    let hierarchyHit = false;
    if (!directHit && targetUri) {
      hierarchyHit = nodes.some((cat) => {
        if (!cat.uri) return false;
        const u = normalizeUri(cat.uri);
        return u === targetUri || u.startsWith(targetUri);
      });
    }
    if (directHit || hierarchyHit) {
      matched.push(post);
      if (matched.length >= limit) break;
    }
  }

  return matched;
}

// Posts that share at least one category with `post`, excluding `post` itself.
// Used for the related-tips sidebar on tip post pages.
export function relatedPosts(
  snapshot: Snapshot | null,
  post: SnapshotPost | { slug: string; categories?: { nodes: SnapshotCategoryNode[] } },
  limit: number,
): SnapshotPost[] {
  if (!snapshot) return [];

  const sharedCategoryIds = new Set<number>();
  (post.categories?.nodes ?? []).forEach((cat) => {
    if (typeof cat.databaseId === "number") sharedCategoryIds.add(cat.databaseId);
  });

  if (sharedCategoryIds.size === 0) return [];

  const matched: SnapshotPost[] = [];
  for (const candidate of snapshot.posts) {
    if (candidate.slug === post.slug) continue;
    const candidateIds = candidate.categories?.nodes?.map((c) => c.databaseId) ?? [];
    if (candidateIds.some((id) => sharedCategoryIds.has(id))) {
      matched.push(candidate);
      if (matched.length >= limit) break;
    }
  }

  return matched;
}

// Lightweight slug-only listings used by [...path].astro's getStaticPaths.
export function allPostSlugsFrom(snapshot: Snapshot | null, limit: number) {
  if (!snapshot) return [];
  return snapshot.posts.slice(0, limit).map((p) => ({ slug: p.slug, uri: p.uri }));
}

export function allCategorySlugsFrom(snapshot: Snapshot | null, limit: number) {
  if (!snapshot) return [];
  return snapshot.categories
    .filter((c) => categoryHasRenderableContent(snapshot, c))
    .slice(0, limit)
    .map((c) => ({ slug: c.slug, uri: c.uri }));
}

export function allPagesFrom(snapshot: Snapshot | null) {
  if (!snapshot) return [];
  return snapshot.pages;
}

export function latestPostsFrom(snapshot: Snapshot | null, limit: number): SnapshotPost[] {
  if (!snapshot) return [];
  return snapshot.posts.slice(0, limit);
}

export function categoriesFrom(snapshot: Snapshot | null, limit: number): SnapshotCategory[] {
  if (!snapshot) return [];
  // Match the rendered route set: current-tip categories plus evergreen
  // categories with meaningful top or bottom SEO copy.
  return snapshot.categories
    .filter((c) => categoryHasRenderableContent(snapshot, c))
    .slice(0, limit);
}
