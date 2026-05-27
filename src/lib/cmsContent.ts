const publicWordPressOrigin = "https://www.oddstips.co.uk";

function wordpressOriginFromEndpoint() {
  const endpoint = import.meta.env.WPGRAPHQL_ENDPOINT;

  if (!endpoint) {
    return null;
  }

  try {
    return new URL(endpoint).origin;
  } catch {
    return null;
  }
}

function publicSiteOrigin() {
  const explicit = import.meta.env.PUBLIC_SITE_URL;

  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // fall through to default
    }
  }

  return publicWordPressOrigin;
}

const knownCmsOrigins = () =>
  new Set(
    [
      wordpressOriginFromEndpoint(),
      "https://wordpress-514209-5717601.cloudwaysapps.com",
    ].filter((v): v is string => Boolean(v)),
  );

// Yoast canonicals and OG URLs come back from WPGraphQL with the WordPress
// staging origin baked in. Swap them for the public frontend origin so the
// rendered <link rel="canonical"> and og:url tags do not leak the CMS host.
export function rewriteCmsLink(url?: string | null) {
  if (!url) {
    return url ?? undefined;
  }

  try {
    const parsed = new URL(url);

    if (knownCmsOrigins().has(parsed.origin)) {
      return `${publicSiteOrigin()}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

export function rewriteCmsAssetUrls(html = "") {
  const uploadPath = "/wp-content/uploads/";
  const sourceOrigins = new Set([
    wordpressOriginFromEndpoint(),
    "https://wordpress-514209-5717601.cloudwaysapps.com",
  ]);

  let normalized = html;

  sourceOrigins.forEach((origin) => {
    if (!origin || origin === publicWordPressOrigin) {
      return;
    }

    normalized = normalized
      .split(`${origin}${uploadPath}`)
      .join(`${publicWordPressOrigin}${uploadPath}`);
  });

  return normalized.replace(
    /(["'(])\/wp-content\/uploads\//g,
    `$1${publicWordPressOrigin}${uploadPath}`,
  );
}
