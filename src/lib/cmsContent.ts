import { affiliateLinks } from "@/lib/affiliateLinks";
// astro:env schema (see astro.config.mjs). Using these imports rather than
// import.meta.env ensures the values are available to the SSR worker at
// runtime, not just at build time for static pages.
import { WPGRAPHQL_ENDPOINT, PUBLIC_SITE_URL } from "astro:env/server";

const publicWordPressOrigin = "https://www.oddstips.co.uk";

function wordpressOriginFromEndpoint() {
  if (!WPGRAPHQL_ENDPOINT) {
    return null;
  }

  try {
    return new URL(WPGRAPHQL_ENDPOINT).origin;
  } catch {
    return null;
  }
}

// Public frontend origin. PUBLIC_SITE_URL is set in .env / Cloudflare Pages env
// (https://www.oddstips.co.uk on live). Falls back to the public Oddstips
// origin used by asset rewriting.
export function publicSiteOrigin() {
  if (PUBLIC_SITE_URL) {
    try {
      return new URL(PUBLIC_SITE_URL).origin;
    } catch {
      // fall through to default
    }
  }

  return publicWordPressOrigin;
}

// All origins we treat as "internal" for the purposes of stripping to a
// relative path. Includes:
//   - The WP backend (live Cloudways host derived from WPGRAPHQL_ENDPOINT)
//   - The staging Cloudways host
//   - The public site origin (www.oddstips.co.uk on live). Needed because WP
//     editors sometimes paste the live URL into menu items instead of adding
//     them via the Categories panel; without this, those items would be
//     classed as external and open in a new tab.
const knownCmsOrigins = () =>
  new Set(
    [
      wordpressOriginFromEndpoint(),
      "https://wordpress-514209-5717601.cloudwaysapps.com",
      publicSiteOrigin(),
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

// WP menu items return absolute URLs to the Cloudways origin. For internal
// links we want relative paths so they survive any future domain change
// without rewriting. External URLs (e.g. affiliate links) stay absolute.
export function cmsLinkToPath(url?: string | null) {
  if (!url) {
    return url ?? undefined;
  }

  try {
    const parsed = new URL(url);

    if (knownCmsOrigins().has(parsed.origin)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

// WP-authored HTML can contain bare EveryTip /go/ affiliate URLs (e.g. in
// generic page bodies like /thanks-for-signing-up/). The site now self-hosts
// the same cloak at oddstips.co.uk/go/{slug}/ with GA4 tracking, so rewrite
// any matching link to the local cloak. Unknown slugs are left untouched: if
// WP content links to an EveryTip slug we have not yet registered in
// affiliateLinks, the original URL survives so the link still works.
const everytipGoPattern = /https?:\/\/(?:www\.)?everytip\.co\.uk\/go\/([a-z0-9-]+)\/?/gi;

function rewriteAffiliateLinksInHtml(html: string): string {
  return html.replace(everytipGoPattern, (match, slug: string) => {
    if (Object.prototype.hasOwnProperty.call(affiliateLinks, slug)) {
      return `/go/${slug}/`;
    }
    return match;
  });
}

// Rewrite hrefs and any other absolute references in WP HTML that point at a
// known CMS origin to use the public site origin instead. WordPress's home URL
// is set to the Cloudways host and must stay that way (changing it breaks
// internal WP redirects), so any internal link an editor inserts via the WP UI
// gets the staging-style host baked into the href. Without this rewrite they
// leak through to the live site as visible cloudwaysapps.com links.
function rewriteCmsLinksInHtml(html: string) {
  let out = html;
  const target = publicSiteOrigin();
  const sourceOrigins = [
    wordpressOriginFromEndpoint(),
    "https://wordpress-514209-5717601.cloudwaysapps.com",
  ].filter((v): v is string => Boolean(v));

  for (const origin of sourceOrigins) {
    if (origin === target) continue;
    out = out.split(origin).join(target);
  }
  return out;
}

// Single-call rewriter for WP-authored HTML content. Handles:
//   - /wp-content/uploads/ asset URLs (swaps CMS origin for public origin)
//   - CMS-origin hrefs anywhere in the HTML (swap to public origin so editor-
//     inserted internal links don't leak the cloudwaysapps.com host)
//   - EveryTip /go/{slug} affiliate URLs (swaps for the local /go/{slug}/ cloak)
//
// Apply this everywhere WP HTML is rendered via <... set:html={...} />, i.e.
// GenericPage, TipPostPage's lede/relatedReading, and category SEO copy.
export function rewriteCmsHtml(html = "") {
  return rewriteAffiliateLinksInHtml(
    rewriteCmsLinksInHtml(rewriteCmsAssetUrls(html)),
  );
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
