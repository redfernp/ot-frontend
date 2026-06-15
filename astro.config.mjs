import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs";
import path from "node:path";

// astro.config.mjs runs before Astro's astro:env module reads the .env file,
// so process.env.WPGRAPHQL_ENDPOINT is not set yet when our build:start hook
// fires. Load .env manually here so the snapshot prefetch can fetch the
// snapshot during the build. Has no effect in CI/CF Pages where env vars are
// already injected before node starts.
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
} catch {
  // Silent: the hook handles missing env gracefully.
}

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

// (broken mojibake URI -> clean ASCII URI). paul365 stores some slugs with
// the fingerprint `a%c2%XX` from a known UTF-8/Latin-1 encoding bug; the
// snapshot prefetch detects them and we emit 301 redirects in
// dist/_redirects at build:done so Google's existing index of mangled URLs
// has a clean redirect target. Static pages get built at the cleaned URI
// by the snapshot loader in src/lib/snapshot.ts; this map is purely for
// the legacy-URL redirect side.
const mojibakeRedirects = new Map();

// Per-byte ASCII transliteration for the trailing %c2%XX of each mojibake
// pair. Must stay in sync with src/lib/slugSanitize.ts -- if they diverge,
// dist/_redirects will redirect to a URL that doesn't exist in the build.
const MOJIBAKE_TRAILING_TO_ASCII = {
  a0: "a", a1: "a", a2: "a", a3: "a", a4: "a", a5: "a",
  a6: "ae", a7: "c", a8: "e", a9: "e", aa: "e", ab: "e",
  ac: "i", ad: "i", ae: "i", af: "i",
  b0: "d", b1: "n",
  b2: "o", b3: "o", b4: "o", b5: "o", b6: "o", b8: "o",
  b9: "u", ba: "u", bb: "u", bc: "u",
  bd: "y", bf: "y",
};
const MOJIBAKE_PATTERN_GLOBAL = /a%c2%([a-f0-9]{2})/gi;
function cleanMojibakeUri(uri) {
  return uri.replace(MOJIBAKE_PATTERN_GLOBAL, (match, hex) => {
    const ascii = MOJIBAKE_TRAILING_TO_ASCII[hex.toLowerCase()];
    return ascii ?? match;
  });
}

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

        // Helper: record a mojibake (broken raw URI -> clean URI) pair and
        // return the clean URI to use for downstream sitemap bookkeeping.
        // src/lib/snapshot.ts does the same cleanup at runtime so static
        // pages are built at the clean URI; the redirect lets Google's
        // existing index of mangled URLs land at the right place.
        function recordAndClean(rawUri) {
          if (!rawUri) return rawUri;
          if (!/a%c2%[a-f0-9]{2}/i.test(rawUri)) return rawUri;
          const clean = cleanMojibakeUri(rawUri);
          if (clean !== rawUri) {
            mojibakeRedirects.set(normalizeUri(rawUri), normalizeUri(clean));
          }
          return clean;
        }

        // Categories: collect noindex URIs. No lastmod (no publish date on a
        // taxonomy term, and build-time fallback is fine for archives).
        for (const cat of snap.categories ?? []) {
          const cleanUri = recordAndClean(cat.uri);
          if (cat?.seo?.noindex) sitemapData.noindexUris.add(normalizeUri(cleanUri));
        }
        // Posts: use post_modified_gmt as lastmod. Sitemaps.org defines
        // <lastmod> as "the date of last modification of the file", so this
        // is the semantically correct field. For tip posts written once by
        // the paul365 cron and never edited it equals post.date anyway, but
        // if anything ever gets edited Google sees a real recrawl signal.
        // Explicitly NOT eventStart (fixture kickoff would push lastmod into
        // the future for upcoming matches and is invalid per the spec).
        for (const post of snap.posts ?? []) {
          const uri = normalizeUri(recordAndClean(post.uri));
          if (post?.seo?.noindex) sitemapData.noindexUris.add(uri);
          if (post.modified) sitemapData.lastmodByUri.set(uri, post.modified);
        }
        // Pages: snapshot only carries `modified` (no publish date), which is
        // the best available proxy for evergreen pages that get edited but
        // not re-published.
        for (const page of snap.pages ?? []) {
          const uri = normalizeUri(recordAndClean(page.uri));
          if (page?.seo?.noindex) sitemapData.noindexUris.add(uri);
          if (page.modified) sitemapData.lastmodByUri.set(uri, page.modified);
        }

        console.log(
          `[sitemap] Prefetched snapshot: ${sitemapData.noindexUris.size} noindex URIs to exclude, ${sitemapData.lastmodByUri.size} URIs with lastmod, ${mojibakeRedirects.size} mojibake redirects pending.`,
        );
      } catch (err) {
        console.warn("[sitemap] Snapshot prefetch failed; sitemap will not filter or set lastmod:", err);
      }
    },
    // After the build completes, append the legacy-URL 301s to dist/_redirects
    // so CF Pages picks them up on deploy. We append (don't rewrite) so the
    // public/_redirects entries (hand-written: William Hill, /wp-content/*,
    // legacy paths) survive.
    "astro:build:done": async ({ dir, logger }) => {
      if (mojibakeRedirects.size === 0) {
        logger?.info?.("[redirects] No mojibake redirects to emit.");
        return;
      }
      try {
        const { default: fs } = await import("node:fs/promises");
        const { fileURLToPath } = await import("node:url");
        const { join } = await import("node:path");
        const outDir = typeof dir === "string" ? dir : fileURLToPath(dir);
        const redirectsPath = join(outDir, "_redirects");
        let existing = "";
        try {
          existing = await fs.readFile(redirectsPath, "utf8");
        } catch {
          // No public/_redirects in the build output; we'll create one.
        }
        const lines = [];
        lines.push("");
        lines.push("# Auto-generated mojibake -> ASCII redirects.");
        lines.push("# paul365 stored some slugs with the `a%c2%XX` encoding bug;");
        lines.push("# src/lib/snapshot.ts cleans them on load so static pages are");
        lines.push("# built at clean URIs, and these 301s point Google's existing");
        lines.push("# index of mangled URLs at the clean equivalents.");
        for (const [from, to] of mojibakeRedirects) {
          lines.push(`${from} ${to} 301`);
        }
        const next = existing.endsWith("\n") || existing === ""
          ? existing + lines.join("\n") + "\n"
          : existing + "\n" + lines.join("\n") + "\n";
        await fs.writeFile(redirectsPath, next, "utf8");
        logger?.info?.(`[redirects] Wrote ${mojibakeRedirects.size} mojibake 301s to ${redirectsPath}.`);
      } catch (err) {
        console.warn("[redirects] Failed to write mojibake redirects:", err);
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
