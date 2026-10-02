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

// Sports where the "teams" in a fixture title are individual players.
const INDIVIDUAL_SPORTS = new Set(["tennis", "darts", "snooker"]);

// SportsEvent for a single tip. Only emitted when the fixture parses into two
// teams and has a real kickoff timestamp; a half-filled event is worse than
// none. No venue data exists in the feed, so location is left out.
export function sportsEventNode(post: WpPost, sportName?: string, competition?: string): JsonLdNode | null {
  const summary = summarizeTip(post);
  const startDate = isoStart(post);
  if (!summary.homeTeam || !summary.awayTeam || !startDate) return null;

  const url = absoluteUrl(post.uri || `/${post.slug}/`);
  const individual = INDIVIDUAL_SPORTS.has((sportName || "").toLowerCase());
  const team = (name: string): JsonLdNode => ({
    "@type": individual ? "Person" : "SportsTeam",
    name,
    ...(sportName && !individual ? { sport: sportName } : {}),
  });

  return {
    "@type": "SportsEvent",
    "@id": `${url}#event`,
    name: `${summary.homeTeam} v ${summary.awayTeam}`,
    url,
    startDate,
    ...(sportName ? { sport: sportName } : {}),
    ...(competition ? { superEvent: { "@type": "SportsEvent", name: competition } } : {}),
    homeTeam: team(summary.homeTeam),
    awayTeam: team(summary.awayTeam),
    competitor: [team(summary.homeTeam), team(summary.awayTeam)],
  };
}

// CollectionPage for a hub/category listing, with an ItemList of the soonest
// upcoming fixtures. Capped so the hub HTML does not balloon.
export function collectionPageNode(opts: {
  name: string;
  path: string;
  description?: string;
  posts: WpPost[];
  sportName?: string;
  limit?: number;
  // false = list the posts exactly as given (when they mirror what the page
  // shows). true = pick the soonest upcoming fixtures.
  upcomingOnly?: boolean;
}): JsonLdNode {
  const { name, path, description, posts, sportName, limit = 20, upcomingOnly = true } = opts;
  const now = Date.now();
  const pool = upcomingOnly
    ? posts
        .filter((post) => {
          const start = isoStart(post);
          return start && new Date(start).getTime() >= now - 3 * 60 * 60 * 1000;
        })
        .sort((a, b) => (isoStart(a) ?? "").localeCompare(isoStart(b) ?? ""))
    : posts;
  const events = pool
    .map((post) => sportsEventNode(post, sportName))
    .filter((node): node is JsonLdNode => Boolean(node))
    .slice(0, limit);

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
    ...(events.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: events.length,
            itemListElement: events.map((event, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: event,
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
