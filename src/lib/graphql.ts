type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
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

export async function wpGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  if (!endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`WPGraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data ?? null;
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
      posts?: {
        nodes: WpPost[];
      };
      categoryTopSeoText?: {
        categoryTopSeoTextEditor?: string;
      };
      categoryBottomSeoText?: {
        categoryBottomSeoText?: string;
      };
    };
  }>(
    `query CategoryBySlug($slug: ID!, $postLimit: Int!) {
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
        posts(first: $postLimit, where: { orderby: { field: DATE, order: DESC } }) {
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
      }
    }`,
    { slug, postLimit },
  );

  return data?.category ?? null;
}

export async function getInternationalTips(limit = 6) {
  // Pull latest international match tips. Probes the categories used on live Oddstips
  // for international fixtures (international-match, europe-friendlies, world-cup, etc).
  // First non-empty response wins; otherwise returns [].
  const candidateSlugs = [
    "international-match",
    "international",
    "europe-friendlies",
    "world-cup",
  ];

  for (const slug of candidateSlugs) {
    const posts = await getCategoryPostTitles(slug, limit).catch(() => []);

    if (posts.length) {
      return posts;
    }
  }

  return [];
}

export async function getCategoryPostTitles(slug: string, limit = 4) {
  // Lightweight query: titles + URIs only. Used by homepage "Latest X Tips" sections
  // where the live site renders title-only cards.
  const data = await wpGraphQL<{
    category?: {
      posts?: {
        nodes: WpPost[];
      };
    };
  }>(
    `query CategoryPostTitles($slug: ID!, $limit: Int!) {
      category(id: $slug, idType: SLUG) {
        posts(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
          nodes {
            id
            slug
            uri
            title
            date
          }
        }
      }
    }`,
    { slug, limit },
  );

  return data?.category?.posts?.nodes ?? [];
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
