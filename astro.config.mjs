import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Fully static build: every WP-backed URL (category, tip post, page) is
// prerendered at build time by [...path].astro's getStaticPaths. No SSR
// worker, no on-demand WP queries from visitor traffic. The 2GB Cloudways
// WP backend cannot reliably serve worker queries on cache miss, so we
// instead front-load all WP work into the build itself and serve pure
// static HTML to visitors.
//
// The cloudflare adapter is kept in case we ever need to add an SSR route
// (e.g. for forms or auth); with output:"static" it has no runtime effect.
//
// Trade-off: tips published between builds aren't visible until the next
// build. We schedule hourly CF Pages rebuilds via external cron + webhook
// to keep freshness within one hour.
//
// Env schema (Astro 5): declares every env var the app touches so values
// reach the build process reliably via astro:env/server imports.
// All vars are access:"public" so they bake into static output at build time.
export default defineConfig({
  output: "static",
  adapter: cloudflare(),
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
