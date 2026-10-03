import type { WpPost } from "@/lib/graphql";
import { publicSiteOrigin } from "@/lib/cmsContent";
import { summarizeTip } from "@/lib/tips";

// -----------------------------------------------------------------------------
// schema.org JSON-LD builders.
//
// Organization + WebSite are emitted once per page from <Seo>. Page components
// add their own nodes (BreadcrumbList, SportsEvent, CollectionPage) through
// <JsonLd>, referencing the site-wide nodes by @id so Google can join them into
// a single entity graph.
// -----------------------------------------------------------------------------

export type JsonLdNode = Record<string, unknown>;
export type Crumb = { label: string; href?: string };

const origin = () => publicSiteOrigin();
export const organizationId = () => `${origin()}/#organization`;
export const websiteId = () => `${origin()}/#website`;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: "OddsTips",
    alternateName: "OddsTips.co.uk",
    url: `${origin()}/`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/favicon.svg"),
    },
    description:
      "Free betting tips, predictions and bookmaker reviews built from statistical analysis, odds data and editorial review.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact/"),
      areaServed: "GB",
      availableLanguage: "en-GB",
    },
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: "OddsTips",
    url: `${origin()}/`,
    inLanguage: "en-GB",
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin()}/search/?s={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Mirrors the visible breadcrumb trail. The last crumb has no href in the UI,
// so it falls back to the current page URL.
export function breadcrumbNode(crumbs: Crumb[], currentPath: string): JsonLdNode | null {
  if (crumbs.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href || currentPath),
    })),
  };
}

function isoStart(post: WpPost): string | null {
  if (!post.eventStart) return null;
  const d = new Date(post.eventStart);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Tips are listed as plain ListItems (name + URL), not SportsEvents. Google
// validates any SportsEvent against its Event rich result rules, which require
// a venue ("location"). The feed has no venue data, so every event failed as
// "Missing field location". Re-add SportsEvent once real venues are available.
function tipName(post: WpPost): string {
  const summary = summarizeTip(post);
  if (summary.homeTeam && summary.awayTeam) return `${summary.homeTeam} v ${summary.awayTeam}`;
  return summary.fixture || post.title || "Betting tip";
}

// CollectionPage for a hub/category listing, with an ItemList of its tips.
// Capped so the hub HTML does not balloon.
export function collectionPageNode(opts: {
  name: string;
  path: string;
  description?: string;
  posts: WpPost[];
  limit?: number;
  // false = list the posts exactly as given (when they mirror what the page
  // shows). true = pick the soonest upcoming fixtures.
  upcomingOnly?: boolean;
}): JsonLdNode {
  const { name, path, description, posts, limit = 20, upcomingOnly = true } = opts;
  const now = Date.now();
  const pool = upcomingOnly
    ? posts
        .filter((post) => {
          const start = isoStart(post);
          return start && new Date(start).getTime() >= now - 3 * 60 * 60 * 1000;
        })
        .sort((a, b) => (isoStart(a) ?? "").localeCompare(isoStart(b) ?? ""))
    : posts;
  const items = pool.slice(0, limit);

  const url = absoluteUrl(path);
  return {
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    name,
    url,
    ...(description ? { description } : {}),
    inLanguage: "en-GB",
    isPartOf: { "@id": websiteId() },
    publisher: { "@id": organizationId() },
    ...(items.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((post, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: tipName(post),
              url: absoluteUrl(post.uri || `/${post.slug}/`),
            })),
          },
        }
      : {}),
  };
}

// Serialise for a <script type="application/ld+json"> body. Escapes "<" so a
// team or page name can never close the script tag early.
export function serializeJsonLd(nodes: Array<JsonLdNode | null | undefined>): string {
  const graph = nodes.filter((node): node is JsonLdNode => Boolean(node));
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
