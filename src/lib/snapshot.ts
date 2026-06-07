// Snapshot loader. The Oddstips Snapshot WordPress plugin dumps every category,
// post, and page into a single JSON file at /wp-content/uploads/tips-snapshot.json.
// This module fetches that file once per build, caches it in module state, and
// exposes accessor helpers that mirror the shape WPGraphQL used to return.
//
// All the static-build code in [...path].astro and the static-data helpers in
// graphql.ts read from this module instead of making hundreds of GraphQL calls
// against the 2GB Cloudways WP backend. Result: build time drops from ~15
// minutes to <2 minutes and WP gets touched exactly once per build.

import { WPGRAPHQL_ENDPOINT } from "astro:env/server";

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

async function fetchSnapshot(): Promise<Snapshot | null> {
  const url = snapshotUrl();
  if (!url) {
    console.warn("[snapshot] No WPGRAPHQL_ENDPOINT set; snapshot unavailable. Build will produce minimal static pages.");
    return null;
  }

  // Add a cache-buster so any WP-side or CDN cache layer doesn't serve a
  // stale empty response from before the plugin was installed. Use a real
  // browser-ish User-Agent so bot protection (Imunify360 / WAFs) is less
  // likely to challenge or block the request.
  const cacheBuster = Date.now();
  const urlWithBuster = `${url}?cb=${cacheBuster}`;
  console.log(`[snapshot] Fetching ${urlWithBuster}`);
  const start = Date.now();

  try {
    const response = await fetch(urlWithBuster, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; OddstipsBuild/1.0)",
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
      console.warn(
        `[snapshot] HTTP ${status} fetching snapshot. First 500 chars of body:\n${body.slice(0, 500)}`,
      );
      return null;
    }

    const rawText = await response.text();
    const ms = Date.now() - start;

    if (rawText.length < 100) {
      console.warn(`[snapshot] Response body suspiciously small (${rawText.length} bytes). First 500 chars:\n${rawText.slice(0, 500)}`);
    }

    let data: Snapshot;
    try {
      data = JSON.parse(rawText) as Snapshot;
    } catch (parseError) {
      console.warn(`[snapshot] JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}. First 500 chars of body:\n${rawText.slice(0, 500)}`);
      return null;
    }

    const sizeMb = (rawText.length / 1024 / 1024).toFixed(2);
    console.log(
      `[snapshot] Loaded in ${ms}ms: ${data.categories?.length ?? 0} categories, ${data.posts?.length ?? 0} posts, ${data.pages?.length ?? 0} pages (${sizeMb} MB)`,
    );

    if ((data.categories?.length ?? 0) === 0 && (data.posts?.length ?? 0) === 0) {
      console.warn(`[snapshot] Snapshot has zero categories AND zero posts. First 500 chars of body:\n${rawText.slice(0, 500)}`);
    }

    return data;
  } catch (error) {
    console.warn(`[snapshot] Fetch failed: ${error instanceof Error ? error.message : String(error)}; build will use empty snapshot`);
    return null;
  }
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
  return snapshot.categories.slice(0, limit).map((c) => ({ slug: c.slug, uri: c.uri }));
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
  // Match the "hideEmpty: true" behaviour of WPGraphQL by default.
  return snapshot.categories.filter((c) => c.count > 0).slice(0, limit);
}
