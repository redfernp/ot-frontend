type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type DateQueryParts = {
  year: number;
  month: number;
  day: number;
};

type DateQuery = {
  after: DateQueryParts;
  before: DateQueryParts;
  inclusive: boolean;
};

type WpGraphQLOptions = {
  retryDelaysMs?: number[];
  timeoutMs?: number;
};

type ChildCategoryConnection = {
  pageInfo?: {
    hasNextPage?: boolean;
    endCursor?: string | null;
  };
  nodes: Array<{
    databaseId?: number;
    count?: number | null;
  }>;
};

export type WpPost = {
  id: string;
  slug: string;
  uri?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  date?: string;
  modified?: string;
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

// Env vars come via Astro 5's astro:env schema (declared in astro.config.mjs)
// rather than import.meta.env so the values reliably reach the SSR worker
// bundle. Without this, [...path].astro running on the Cloudflare edge sees
// `undefined` for WPGRAPHQL_ENDPOINT and every category / tip post 404s.
import {
  WPGRAPHQL_ENDPOINT,
  WP_BASIC_AUTH_USER,
  WP_BASIC_AUTH_PASSWORD,
} from "astro:env/server";

const endpoint = WPGRAPHQL_ENDPOINT;
const defaultRetryDelaysMs = [1000, 2000, 4000];
const parentSportCategorySlugs = new Set(["tennis", "cricket", "snooker", "darts", "basketball"]);

function authHeader(): Record<string, string> {
  const user = WP_BASIC_AUTH_USER;
  const password = WP_BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return {};
  }

  return {
    Authorization: `Basic ${btoa(`${user}:${password}`)}`,
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function todayDateQuery(timeZone = "Europe/London"): DateQuery {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };

  return {
    after: today,
    before: today,
    inclusive: true,
  };
}

export async function wpGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: WpGraphQLOptions = {},
): Promise<T | null> {
  if (!endpoint) {
    return null;
  }

  const retryDelaysMs = options.retryDelaysMs ?? defaultRetryDelaysMs;

  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ query, variables }),
  };

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    let response: Response;
    const controller = options.timeoutMs ? new AbortController() : undefined;
    const timeout = controller ? setTimeout(() => controller.abort(), options.timeoutMs) : undefined;

    try {
      response = await fetch(endpoint, {
        ...request,
        signal: controller?.signal,
      });
    } catch (error) {
      if (attempt < retryDelaysMs.length) {
        await wait(retryDelaysMs[attempt]);
        continue;
      }

      throw new Error(`WPGraphQL request failed after ${attempt + 1} attempts: ${formatError(error)}`);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }

    if (!response.ok) {
      const message = `WPGraphQL request failed: ${response.status} ${response.statusText}`;

      if (response.status >= 500 && attempt < retryDelaysMs.length) {
        await wait(retryDelaysMs[attempt]);
        continue;
      }

      throw new Error(message);
    }

    let payload: GraphQLResponse<T>;

    try {
      payload = (await response.json()) as GraphQLResponse<T>;
    } catch (error) {
      if (attempt < retryDelaysMs.length) {
        await wait(retryDelaysMs[attempt]);
        continue;
      }

      throw new Error(`WPGraphQL response was not valid JSON after ${attempt + 1} attempts: ${formatError(error)}`);
    }

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    return payload.data ?? null;
  }

  return null;
}

export async function getLatestPosts(limit = 8) {
  const data = await wpGraphQL<{
    posts: {
      nodes: WpPost[];
    };
  }>(
    `query LatestPosts($limit: Int!) {
      posts(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          uri
          title
          excerpt
          date
          modified
          seo {
            title
            metaDesc
            canonical
          }
        }
      }
    }`,
    { limit },
  );

  return data?.posts.nodes ?? [];
}

export async function getCategories(limit = 25) {
  const data = await wpGraphQL<{
    categories: {
      nodes: WpCategory[];
    };
  }>(
    `query Categories($limit: Int!) {
      categories(first: $limit, where: { hideEmpty: true }) {
        nodes {
          id
          slug
          uri
          name
          description
          seo {
            title
            metaDesc
            canonical
          }
        }
      }
    }`,
    { limit },
  );

  return data?.categories.nodes ?? [];
}

export async function getCategory(slug: string, postLimit = 30) {
  // ACF Pro fields on the Category taxonomy (added by Paul):
  //   category_top_seo_text     (WYSIWYG)   -> rendered under H1 on the category page
  //   category_bottom_seo_text  (textarea)  -> rendered under the tips list
  // WPGraphQL for ACF exposes each ACF field as its own object type, with the actual
  // value living on a per-field-type inner property (Editor for wp_editor, the field
  // name itself for textarea).
  const data = await wpGraphQL<{
    category?: WpCategory & {
      categoryTopSeoText?: {
        categoryTopSeoTextEditor?: string;
      };
      categoryBottomSeoText?: {
        categoryBottomSeoText?: string;
      };
    };
    posts?: {
      nodes: WpPost[];
    };
  }>(
    `query CategoryBySlug($slug: ID!, $categoryName: String!, $postLimit: Int!) {
      category(id: $slug, idType: SLUG) {
        id
        databaseId
        slug
        uri
        name
        description
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          breadcrumbs {
            text
            url
          }
        }
        categoryTopSeoText {
          categoryTopSeoTextEditor
        }
        categoryBottomSeoText {
          categoryBottomSeoText
        }
      }
      posts(first: $postLimit, where: { categoryName: $categoryName, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          uri
          title
          excerpt
          content
          date
        }
      }
    }`,
    { slug, categoryName: slug, postLimit },
  );

  if (!data?.category) {
    return null;
  }

  if (parentSportCategorySlugs.has(slug) && !data.posts?.nodes?.length) {
    const childPosts = await getChildCategoryPosts(slug, postLimit);

    if (childPosts.length) {
      return {
        ...data.category,
        posts: { nodes: childPosts },
      };
    }
  }

  return {
    ...data.category,
    posts: data.posts,
  };
}

async function getChildCategoryDatabaseIds(slug: string) {
  const ids: string[] = [];
  let after: string | null = null;

  do {
    const data: {
      category?: {
        children?: ChildCategoryConnection;
      };
    } | null = await wpGraphQL(
      `query ChildCategoryIds($slug: ID!, $after: String) {
        category(id: $slug, idType: SLUG) {
          children(first: 100, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              databaseId
              count
            }
          }
        }
      }`,
      { slug, after },
    );

    const connection: ChildCategoryConnection | undefined = data?.category?.children;

    connection?.nodes.forEach((node) => {
      if (typeof node.databaseId === "number" && node.count !== null && node.count !== 0) {
        ids.push(String(node.databaseId));
      }
    });

    after = connection?.pageInfo?.hasNextPage ? connection.pageInfo.endCursor || null : null;
  } while (after);

  return ids;
}

async function getChildCategoryPosts(slug: string, postLimit: number) {
  const categoryIds = await getChildCategoryDatabaseIds(slug);

  if (!categoryIds.length) {
    return [];
  }

  const data = await wpGraphQL<{
    posts?: {
      nodes: WpPost[];
    };
  }>(
    `query ChildCategoryPosts($categoryIds: [ID], $postLimit: Int!) {
      posts(first: $postLimit, where: { categoryIn: $categoryIds, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          uri
          title
          excerpt
          content
          date
        }
      }
    }`,
    { categoryIds, postLimit },
  );

  return data?.posts?.nodes ?? [];
}

export async function getInternationalTips(limit = 6) {
  const dateQuery = todayDateQuery();
  const candidateSlugs = [
    "international-match",
    "international",
    "europe-friendlies",
    "world-cup",
  ];

  for (const slug of candidateSlugs) {
    const posts = await getCategoryPostTitles(slug, limit, dateQuery).catch(() => []);

    if (posts.length) {
      return posts;
    }
  }

  return [];
}

export async function getCategoryPostTitles(slug: string, limit = 4, dateQuery?: DateQuery) {
  // Lightweight query: titles + URIs only. Used by homepage "Latest X Tips" sections
  // where the live site renders title-only cards.
  const data = await wpGraphQL<{
    posts?: {
      nodes: WpPost[];
    };
  }>(
    `query CategoryPostTitles($slug: String!, $limit: Int!, $dateQuery: DateQueryInput) {
      posts(first: $limit, where: { categoryName: $slug, orderby: { field: DATE, order: DESC }, dateQuery: $dateQuery }) {
        nodes {
          id
          slug
          uri
          title
          date
        }
      }
    }`,
    { slug, limit, dateQuery },
  );

  return data?.posts?.nodes ?? [];
}

export async function getPost(slug: string) {
  const data = await wpGraphQL<{
    post?: WpPost & {
      content?: string;
      categories?: {
        nodes: WpCategory[];
      };
    };
  }>(
    `query PostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        id
        slug
        uri
        title
        excerpt
        content
        date
        modified
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          breadcrumbs {
            text
            url
          }
        }
        categories {
          nodes {
            id
            databaseId
            slug
            uri
            name
          }
        }
      }
    }`,
    { slug },
  );

  return data?.post ?? null;
}

export async function getRelatedPosts(post: WpPost, limit = 6) {
  const categoryIds = (post.categories?.nodes ?? [])
    .map((category) => category.databaseId)
    .filter((id): id is number => typeof id === "number")
    .map(String);

  if (!categoryIds.length) {
    return [];
  }

  const data = await wpGraphQL<{
    posts?: {
      nodes: WpPost[];
    };
  }>(
    `query RelatedPosts($categoryIds: [ID], $limit: Int!) {
      posts(first: $limit, where: { categoryIn: $categoryIds, orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          uri
          title
          excerpt
          content
          date
        }
      }
    }`,
    { categoryIds, limit: limit + 1 },
  );

  return (data?.posts?.nodes ?? []).filter((related) => related.slug !== post.slug).slice(0, limit);
}

export async function getPage(slug: string) {
  const data = await wpGraphQL<{
    page?: WpPost & {
      content?: string;
    };
  }>(
    `query PageBySlug($slug: ID!) {
      page(id: $slug, idType: URI) {
        id
        slug
        uri
        title
        content
        modified
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          breadcrumbs {
            text
            url
          }
        }
      }
    }`,
    { slug },
  );

  return data?.page ?? null;
}

export async function getPages(limit = 100) {
  type PagesResponse = {
    pages?: {
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      nodes: WpPost[];
    };
  };

  const pages: WpPost[] = [];
  let after: string | null = null;

  do {
    const data: PagesResponse | null = await wpGraphQL<PagesResponse>(
      `query Pages($limit: Int!, $after: String) {
        pages(first: $limit, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            slug
            uri
            title
            content
            modified
            seo {
              title
              metaDesc
              canonical
              opengraphTitle
              opengraphDescription
              breadcrumbs {
                text
                url
              }
            }
          }
        }
      }`,
      { limit, after },
    );

    const connection: PagesResponse["pages"] = data?.pages;
    pages.push(...(connection?.nodes ?? []));
    after = connection?.pageInfo?.hasNextPage ? connection.pageInfo.endCursor || null : null;
  } while (after);

  return pages;
}

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

// Module-level cache so each menu is fetched once per build, not once per page
// render. CategorySidebar renders on every category / sub-category route, so the
// same two slugs (popular-leagues, international-games) would otherwise turn
// into ~30 redundant GraphQL calls per build.
const menuCache = new Map<string, Promise<WpMenu | null>>();

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

  const data = await wpGraphQL<MenuResponse>(
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

  if (!node) {
    return null;
  }

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
