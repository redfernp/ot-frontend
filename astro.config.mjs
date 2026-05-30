import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Hybrid render strategy: pages prerender at build by default; routes that
// opt out via `export const prerender = false` are SSR-rendered at the
// Cloudflare edge with our Cache-Control headers. See src/pages/[...path].astro
// and HANDOFF.md Phase 7 for the rationale.
//
// Env schema (Astro 5): declares every env var the app touches so values
// reach the SSR worker bundle reliably. import.meta.env in Astro 5 stops
// inlining non-PUBLIC vars into the server runtime; astro:env is the
// supported escape hatch.
//
// All vars are access:"public" so they bake into the worker at build time.
// WP_BASIC_AUTH_PASSWORD is a staging-only credential; once the live WP
// drops basic auth this field can be removed entirely.
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
