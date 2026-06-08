import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Mutable container populated by the snapshot-prefetch integration at
// astro:build:start, then read by the sitemap integration's filter/serialize
// callbacks at astro:build:done. Plain module-level state because both run in
// the same Node process inside the same build.
const sitemapData = {
  // URI paths (with trailing slash) that should be excluded from the sitemap
  // because Yoast marks them noindex.
  noindexUris: new Set(),
  // URI path -> ISO date string. Used as the <lastmod> for that URL.
  lastmodByUri: new Map(),
};

function normalizeUri(path) {
  if (!path) return "";
  return path.endsWith("/") ? path : path + "/";
}

// Custom integration that fetches the snapshot once at build start and
// populates sitemapData. The sitemap integration's callbacks (defined below)
// reference sitemapData via closure, so by the time they run at build:done the
// data is already there.
//
// Why we re-fetch instead of importing from src/lib/snapshot.ts: this file is
// a .mjs config, and importing TS modules from here is awkward. A second
// snapshot fetch costs ~1s on a ~40s build; acceptable.
const snapshotPrefetchForSitemap = {
  name: "snapshot-prefetch-for-sitemap",
  hooks: {
    "astro:build:start": async () => {
      const wpEndpoint = process.env.WPGRAPHQL_ENDPOINT;
      if (!wpEndpoint) {
        console.warn(
          "[sitemap] No WPGRAPHQL_ENDPOINT; sitemap will not filter noindex URIs or set lastmod.",
        );
        return;
      }

      let url;
      try {
        url = new URL(wpEndpoint);
        url.pathname = "/wp-content/uploads/tips-snapshot.json";
        url.search = "";
      } catch {
        console.warn("[sitemap] Could not derive snapshot URL from WPGRAPHQL_ENDPOINT.");
        return;
      }

      const fetchUrl = `${url.toString()}?cb=${Date.now()}`;

      try {
        const res = await fetch(fetchUrl, {
          headers: {
            Accept: "application/json",
            // Same UA as src/lib/snapshot.ts to dodge Imunify360 bot challenges.
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
        });
        if (!res.ok) {
          console.warn(`[sitemap] Snapshot fetch returned HTTP ${res.status}; sitemap will not filter or set lastmod.`);
          return;
        }
        const snap = await res.json();

        // Categories: collect noindex URIs. No lastmod (no publish date on a
        // taxonomy term, and build-time fallback is fine for archives).
        for (const cat of snap.categories ?? []) {
          if (cat?.seo?.noindex) sitemapData.noindexUris.add(normalizeUri(cat.uri));
        }
        // Posts: use post_modified_gmt as lastmod. Sitemaps.org defines
        // <lastmod> as "the date of last modification of the file", so this
        // is the semantically correct field. For tip posts written once by
        // the paul365 cron and never edited it equals post.date anyway, but
        // if anything ever gets edited Google sees a real recrawl signal.
        // Explicitly NOT eventStart (fixture kickoff would push lastmod into
        // the future for upcoming matches and is invalid per the spec).
        for (const post of snap.posts ?? []) {
          const uri = normalizeUri(post.uri);
          if (post?.seo?.noindex) sitemapData.noindexUris.add(uri);
          if (post.modified) sitemapData.lastmodByUri.set(uri, post.modified);
        }
        // Pages: snapshot only carries `modified` (no publish date), which is
        // the best available proxy for evergreen pages that get edited but
        // not re-published.
        for (const page of snap.pages ?? []) {
          const uri = normalizeUri(page.uri);
          if (page?.seo?.noindex) sitemapData.noindexUris.add(uri);
          if (page.modified) sitemapData.lastmodByUri.set(uri, page.modified);
        }

        console.log(
          `[sitemap] Prefetched snapshot: ${sitemapData.noindexUris.size} noindex URIs to exclude, ${sitemapData.lastmodByUri.size} URIs with lastmod.`,
        );
      } catch (err) {
        console.warn("[sitemap] Snapshot prefetch failed; sitemap will not filter or set lastmod:", err);
      }
    },
  },
};

// Fully static build: every WP-backed URL (category, tip post, page) is
// prerendered at build time by [...path].astro's getStaticPaths. Output is
// pure static HTML; no Worker, no SSR runtime, no on-demand WP queries from
// visitor traffic. The 2GB Cloudways WP backend cannot reliably serve
// worker queries on cache miss, so we front-load all WP work into the build
// and serve pure static HTML to visitors.
//
// Removed the @astrojs/cloudflare adapter: it was auto-generating a
// _routes.json file that excluded individual static paths from the Worker,
// and some tip-post slugs exceed CF's 100-char-per-route limit, breaking the
// deploy. With no adapter and no SSR routes, CF Pages serves all files as
// pure static without invoking any Worker logic.
//
// If we ever need SSR back (e.g. for a form endpoint), re-add the adapter
// but configure routesStrategy: "include" with manual route patterns short
// enough to fit the 100-char limit.
//
// Trade-off: tips published between builds aren't visible until the next
// build. Schedule hourly CF Pages rebuilds via external cron + webhook to
// keep freshness within one hour.
//
// Env schema (Astro 5): declares every env var the app touches so values
// reach the build process via astro:env/server imports. All vars are
// access:"public" so they bake into static output at build time.
export default defineConfig({
  output: "static",
  site: "https://www.oddstips.co.uk",
  // Auto-generated sitemap. Picks up every prerendered URL from the build and
  // writes /sitemap-index.xml plus /sitemap-0.xml (paginated automatically once
  // we cross 45k URLs, which we won't anytime soon).
  //
  // Exclusions:
  //   - /go/* affiliate cloaks (pattern match)
  //   - Any URI flagged seo.noindex in the snapshot (Yoast per-item or global
  //     content-type setting). The snapshotPrefetchForSitemap integration loads
  //     these at build start; the filter below reads from that.
  //
  // Lastmod:
  //   - Posts: their post_modified_gmt (snapshot.posts[].modified). Explicitly
  //     NOT eventStart (fixture kickoff would push lastmod into the future for
  //     upcoming matches, invalid per sitemap spec).
  //   - Pages: their modified date.
  //   - Categories and everything else: omitted, defaults to build time.
  //
  // Both integrations must coexist in the correct order: snapshotPrefetch
  // FIRST so its astro:build:start hook populates sitemapData before
  // sitemap's astro:build:done runs.
  integrations: [
    snapshotPrefetchForSitemap,
    sitemap({
      filter: (page) => {
        try {
          const url = new URL(page);
          if (url.pathname.startsWith("/go/")) return false;
          if (sitemapData.noindexUris.has(normalizeUri(url.pathname))) return false;
          return true;
        } catch {
          return true;
        }
      },
      serialize: (item) => {
        try {
          const pathname = normalizeUri(new URL(item.url).pathname);
          const lastmod = sitemapData.lastmodByUri.get(pathname);
          if (lastmod) {
            item.lastmod = lastmod;
          }
        } catch {
          // ignore; default lastmod (build time) stays
        }
        return item;
      },
    }),
  ],
  env: {
    schema: {
      WPGRAPHQL_ENDPOINT: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "",
      }),
      WP_BASIC_AUTH_USER: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "",
      }),
      WP_BASIC_AUTH_PASSWORD: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "",
      }),
      PUBLIC_SITE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "https://www.oddstips.co.uk",
      }),
      PUBLIC_GA4_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "",
      }),
    },
  },
});
