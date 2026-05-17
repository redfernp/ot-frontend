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

export async function getCategory(slug: string) {
  const data = await wpGraphQL<{
    category?: WpCategory & {
      posts?: {
        nodes: WpPost[];
      };
    };
  }>(
    `query CategoryBySlug($slug: ID!) {
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
        posts(first: 12, where: { orderby: { field: DATE, order: DESC } }) {
          nodes {
            id
            slug
            uri
            title
            excerpt
            date
          }
        }
      }
    }`,
    { slug },
  );

  return data?.category ?? null;
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
