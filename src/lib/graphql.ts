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
};

export type WpCategory = {
  id: string;
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

const endpoint = import.meta.env.WPGRAPHQL_ENDPOINT;
const retryDelaysMs = [1000, 2000, 4000];

function authHeader(): Record<string, string> {
  const user = import.meta.env.WP_BASIC_AUTH_USER;
  const password = import.meta.env.WP_BASIC_AUTH_PASSWORD;

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
): Promise<T | null> {
  if (!endpoint) {
    return null;
  }

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

    try {
      response = await fetch(endpoint, request);
    } catch (error) {
      if (attempt < retryDelaysMs.length) {
        await wait(retryDelaysMs[attempt]);
        continue;
      }

      throw new Error(`WPGraphQL request failed after ${attempt + 1} attempts: ${formatError(error)}`);
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

  return {
    ...data.category,
    posts: data.posts,
  };
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
