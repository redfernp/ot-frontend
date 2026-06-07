// Frontend data layer.
//
// Historical context: this file used to make ~hundreds of WPGraphQL POSTs per
// build, one per category/post/page render. Against the 2GB Cloudways WP
// backend, that produced 15-min builds that frequently failed under load.
//
// Now: a separate WP plugin (Oddstips Snapshot Generator) writes the entire
// site dataset to a single JSON file at /wp-content/uploads/tips-snapshot.json.
// loadSnapshot() in src/lib/snapshot.ts fetches that file once per build and
// caches it in module state. Every getCategory / getPost / getPage / etc call
// below reads from the in-memory snapshot, no network roundtrip.
//
// The only function in this file that still hits WP at build time is getMenu
// (WP nav menus aren't in the snapshot yet). Menus are cached at module level
// so each unique menu slug fires exactly one WPGraphQL POST per build,
// typically two total (popular-leagues + international-games).

import {
  WPGRAPHQL_ENDPOINT,
  WP_BASIC_AUTH_USER,
  WP_BASIC_AUTH_PASSWORD,
} from "astro:env/server";
import {
  allCategorySlugsFrom,
  allPagesFrom,
  allPostSlugsFrom,
  categoriesFrom,
  findCategoryBySlug,
  findPageByUri,
  findPostBySlug,
  latestPostsFrom,
  loadSnapshot,
  postsForCategory,
  relatedPosts,
  type SnapshotCategory,
  type SnapshotPage,
  type SnapshotPost,
} from "./snapshot";

// -----------------------------------------------------------------------------
// Types (preserved from the old WPGraphQL-typed shape so consumers don't change)
// -----------------------------------------------------------------------------

export type WpPost = {
  id: string;
  slug: string;
  uri?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  date?: string;
  modified?: string;
  // Actual fixture kickoff time (ISO 8601 string) from paul365's event_start
  // post_meta. May be null on non-tip posts.
  eventStart?: string | null;
  seo?: SeoFields;
  categories?: {
    nodes: WpCategory[];
  };
};

export type WpCategory = {
  id: string;
  databaseId?: number;
  slug: string;
  uri?: string;
  name?: string;
  description?: string;
  seo?: SeoFields;
};

export type SeoFields = {
  title?: string;
  metaDesc?: string;
  canonical?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: {
    sourceUrl?: string;
  };
  twitterTitle?: string;
  twitterDescription?: string;
  breadcrumbs?: Array<{
    text?: string;
    url?: string;
  }>;
};

// -----------------------------------------------------------------------------
// Snapshot-backed data accessors
// -----------------------------------------------------------------------------

function postToWp(post: SnapshotPost): WpPost {
  return {
    id: post.id,
    slug: post.slug,
    uri: post.uri,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    date: post.date,
    modified: post.modified,
    eventStart: post.eventStart ?? null,
    seo: post.seo as SeoFields,
    categories: {
      nodes: (post.categories?.nodes ?? []).map((c) => ({
        id: c.id,
        databaseId: c.databaseId,
        slug: c.slug,
        uri: c.uri,
        name: c.name,
      })),
    },
  };
}

function categoryToWp(cat: SnapshotCategory): WpCategory & {
  categoryTopSeoText?: { categoryTopSeoText?: string };
  categoryBottomSeoText?: { categoryBottomSeoText?: string };
} {
  return {
    id: cat.id,
    databaseId: cat.databaseId,
    slug: cat.slug,
    uri: cat.uri,
    name: cat.name,
    description: cat.description,
    seo: cat.seo as SeoFields,
    categoryTopSeoText: cat.categoryTopSeoText,
    categoryBottomSeoText: cat.categoryBottomSeoText,
  };
}

function pageToWp(page: SnapshotPage): WpPost {
  return {
    id: page.id,
    slug: page.slug,
    uri: page.uri,
    title: page.title,
    content: page.content,
    modified: page.modified,
    seo: page.seo as SeoFields,
  };
}

export async function getLatestPosts(limit = 8): Promise<WpPost[]> {
  const snapshot = await loadSnapshot();
  return latestPostsFrom(snapshot, limit).map(postToWp);
}

export async function getCategories(limit = 25): Promise<WpCategory[]> {
  const snapshot = await loadSnapshot();
  return categoriesFrom(snapshot, limit).map(categoryToWp);
}

export async function getCategory(slug: string, postLimit = 30) {
  const snapshot = await loadSnapshot();
  const cat = findCategoryBySlug(snapshot, slug);
  if (!cat) return null;

  const posts = postsForCategory(snapshot, slug, postLimit).map(postToWp);

  return {
    ...categoryToWp(cat),
    posts: { nodes: posts },
  };
}

export async function getInternationalTips(limit = 6): Promise<WpPost[]> {
  const snapshot = await loadSnapshot();
  const candidateSlugs = [
    "international-match",
    "international",
    "europe-friendlies",
    "world-cup",
  ];

  for (const slug of candidateSlugs) {
    const posts = postsForCategory(snapshot, slug, limit);
    if (posts.length) return posts.map(postToWp);
  }
  return [];
}

export async function getCategoryPostTitles(
  slug: string,
  limit = 4,
  _dateQuery?: unknown,
): Promise<WpPost[]> {
  // _dateQuery is ignored in snapshot mode — we can't filter by kickoff window
  // because that data isn't in the snapshot. Caller's responsibility to filter
  // returned posts if they need a specific date.
  const snapshot = await loadSnapshot();
  return postsForCategory(snapshot, slug, limit).map(postToWp);
}

export async function getPost(slug: string): Promise<WpPost | null> {
  const snapshot = await loadSnapshot();
  const post = findPostBySlug(snapshot, slug);
  return post ? postToWp(post) : null;
}

export async function getRelatedPosts(post: WpPost, limit = 6): Promise<WpPost[]> {
  const snapshot = await loadSnapshot();
  const related = relatedPosts(
    snapshot,
    {
      slug: post.slug,
      categories: {
        nodes: (post.categories?.nodes ?? []).map((c) => ({
          id: c.id,
          databaseId: c.databaseId ?? 0,
          slug: c.slug,
          uri: c.uri,
          name: c.name,
        })),
      },
    },
    limit,
  );
  return related.map(postToWp);
}

export async function getPage(uri: string): Promise<WpPost | null> {
  const snapshot = await loadSnapshot();
  const page = findPageByUri(snapshot, uri);
  return page ? pageToWp(page) : null;
}

export async function getPages(_limit = 100): Promise<WpPost[]> {
  const snapshot = await loadSnapshot();
  return allPagesFrom(snapshot).map(pageToWp);
}

// Slug-only listings for [...path].astro getStaticPaths.
export async function getAllPostSlugs(limit = 5000) {
  const snapshot = await loadSnapshot();
  return allPostSlugsFrom(snapshot, limit);
}

export async function getAllCategorySlugs(limit = 2000) {
  const snapshot = await loadSnapshot();
  return allCategorySlugsFrom(snapshot, limit);
}

// -----------------------------------------------------------------------------
// Menus — still fetched from WPGraphQL because they aren't in the snapshot yet.
// Cached at module level so each unique menu slug results in exactly one
// WPGraphQL POST per build (typically 2 total: popular-leagues + international-games).
// If WP is unreachable, returns null and the consuming component renders an
// empty menu rather than failing the whole build.
// -----------------------------------------------------------------------------

export type WpMenuItem = {
  id: string;
  databaseId?: number;
  label: string;
  url?: string | null;
  parentDatabaseId?: number | null;
};

export type WpMenu = {
  databaseId: number;
  name: string;
  slug: string;
  menuItems: WpMenuItem[];
};

const menuCache = new Map<string, Promise<WpMenu | null>>();

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function authHeader(): Record<string, string> {
  const user = WP_BASIC_AUTH_USER;
  const password = WP_BASIC_AUTH_PASSWORD;
  if (!user || !password) return {};
  return { Authorization: `Basic ${btoa(`${user}:${password}`)}` };
}

async function lightWpGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  if (!WPGRAPHQL_ENDPOINT) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(WPGRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[graphql] menu query HTTP ${response.status}`);
        return null;
      }

      const payload = (await response.json()) as GraphQLResponse<T>;
      if (payload.errors?.length) {
        console.warn(`[graphql] menu query errors: ${payload.errors.map((e) => e.message).join("; ")}`);
        return null;
      }

      return payload.data ?? null;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn(`[graphql] menu query failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function fetchMenu(slug: string): Promise<WpMenu | null> {
  type MenuResponse = {
    menus?: {
      nodes: Array<{
        databaseId: number;
        name: string;
        slug: string;
        menuItems?: {
          nodes: Array<{
            id: string;
            databaseId?: number;
            label?: string | null;
            url?: string | null;
            parentDatabaseId?: number | null;
          }>;
        };
      }>;
    };
  };

  const data = await lightWpGraphQL<MenuResponse>(
    `query MenuBySlug($slug: String!) {
      menus(where: { slug: $slug }) {
        nodes {
          databaseId
          name
          slug
          menuItems(first: 100) {
            nodes {
              id
              databaseId
              label
              url
              parentDatabaseId
            }
          }
        }
      }
    }`,
    { slug },
  );

  const node = data?.menus?.nodes?.[0];
  if (!node) return null;

  return {
    databaseId: node.databaseId,
    name: node.name,
    slug: node.slug,
    menuItems: (node.menuItems?.nodes ?? []).map((item) => ({
      id: item.id,
      databaseId: item.databaseId,
      label: item.label ?? "",
      url: item.url,
      parentDatabaseId: item.parentDatabaseId ?? null,
    })),
  };
}

export function getMenu(slug: string): Promise<WpMenu | null> {
  if (!menuCache.has(slug)) {
    menuCache.set(slug, fetchMenu(slug).catch(() => null));
  }
  return menuCache.get(slug)!;
}
