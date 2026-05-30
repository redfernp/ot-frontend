import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Hybrid render strategy:
//   - output: "static" (default) keeps every page prerendered at build time
//   - The Cloudflare adapter is installed so individual routes can opt into
//     edge-rendered SSR via `export const prerender = false`
//   - Currently SSR pages: src/pages/[...path].astro (tip posts, categories,
//     generic WP pages). Edge cache TTLs are set per response.
//
// Why hybrid: the live WP backend publishes new tip posts every ~5 minutes
// via cron, which a pure static build cannot keep up with. Static stays for
// stable surfaces (homepage, free-bets, reviews, go cloaks); WP-content
// surfaces render on demand at the Cloudflare edge with 5-minute cache +
// 24-hour stale-while-revalidate. See HANDOFF.md Phase 7.
export default defineConfig({
  output: "static",
  adapter: cloudflare(),
  site: "https://www.oddstips.co.uk",
});
