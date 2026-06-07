import { defineConfig, envField } from "astro/config";

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
