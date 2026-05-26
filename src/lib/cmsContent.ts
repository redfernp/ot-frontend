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
