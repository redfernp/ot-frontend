# Oddstips Frontend — Design Handoff

Designs locked. This document is for Codex (engineering) to pick up and finish wiring.

For repo, hosting and dev quickstart, see [CLAUDE.md](./CLAUDE.md).

---

## ⚠️ Read this first: why the first Cloudflare Pages deploy failed

A local reproduction of `npm run build` against staging WP revealed three issues. Two are fixed in the latest commit, one is the architectural one that needs Codex's #1 attention.

### 1. TypeScript error in `BookmakerReviewPage.astro` (FIXED)
`bookmaker.bonus.minDeposit` referenced a property that didn't exist on the `bonus` type. Build halted at the `astro check` step. Fixed: now reads `bookmaker.minDeposit` directly.

### 2. `bookmakers is not defined` in reviews getStaticPaths (FIXED)
Astro hoists `getStaticPaths` into an isolated module scope that cannot see top-level page-frontmatter constants. The bookmakers fixture object lived in the page frontmatter, so `getStaticPaths` saw `ReferenceError: bookmakers is not defined`. Fixed: extracted to `src/lib/bookmakers.ts` and the page now imports it. Both routes also pass the `bookmaker` through `props` so each path doesn't re-look it up.

### 3. ECONNRESET from staging WP during static build (NOT FIXED — Codex #1)
With both fixes above, the build progresses past `astro check`, generates the static entrypoints (~3s), then enters `generating static routes`. The catch-all (`src/pages/[...path].astro`) calls `getCategories(100)` + `getLatestPosts(100)` in `getStaticPaths`, producing up to 200 routes. Each route's render then calls `getCategory(slug)` or `getPost(slug)` (1-3s each on warm staging, longer when slow). Two compounding problems:

- **Build time**. Even healthy staging gives ~2-5s per route. 200 routes × 3s = 10 minutes. Cloudflare Pages builds have a 20-minute hard ceiling on the free tier. The job is borderline before any failures.
- **Staging Cloudways flakiness**. Mid-build, WP starts returning `ECONNRESET` on tip post queries. Astro static build has no retry — one connection drop kills the whole build.

This is what HANDOFF Codex TODO #5 (hybrid SSR) is for. Until that's done the build will keep failing.

**Two unblock paths Codex can pick from:**

- **Quick (1 day)**: In `src/pages/[...path].astro`, restrict `getStaticPaths` to a small hardcoded priority list (homepage, `/football/`, `/tennis/`, `/football/united-kingdom/england-premier-league/`, the Sunderland-v-Chelsea showcase tip) and **delete** the legacy `src/pages/category/[slug].astro` + `src/pages/tips/[slug].astro` routes. Everything else 404s until proper SSR lands. This ships the design to staging in hours. Also add a retry-with-backoff wrapper in `src/lib/graphql.ts` `wpGraphQL()` so transient ECONNRESETs don't kill builds.
- **Proper (1-2 weeks)**: Convert to `output: "server"` with `@astrojs/cloudflare` adapter. Tip and category pages render on demand at the edge, cached. No build-time WP traffic. Solves both the time ceiling and the flakiness in one move.

Quick is recommended for the immediate ship + design review; Proper is what should land before going live across all categories.

---

---

## What has been designed and locked

| Template | File | Notes |
| --- | --- | --- |
| Site shell (header, footer, nav, hamburger) | `src/layouts/BaseLayout.astro` | Mirrors live nav: Free Bets pill, Football, More Sports dropdown, About dropdown, Pro Football Tips (external, nofollow). Mobile drawer with `<details>` expansion. |
| Tip post (Sunderland v Chelsea preview) | `src/components/TipPostPage.astro` | Hero, summary strip, Tipster's Read, Match Signals grid, OddsTips Top Value Bet panel, Related Reading, FAQs. |
| Football landing (`/football/`) | `src/components/FootballHubPage.astro` | Brand-blue hero, coupon rows (internationals + all predictions), ACF SEO content, country regional grid, "All Top Leagues" alphabetical list. |
| Tennis landing (`/tennis/`) | `src/components/TennisHubPage.astro` | Same shape as football but no IA blocks that don't exist on live (no league/country chip lists). |
| League category (EPL etc.) | `src/components/CategoryTipsPage.astro` | H1 + top ACF SEO, scannable coupon list, bottom ACF SEO, sidebar. |
| Homepage | `src/pages/index.astro` | Brand-blue hero with search, popular sports grid, popular leagues grid, 5x "Latest [sport] tips" sections, 27-country regions grid. |
| Single tip coupon row | `src/components/CouponRow.astro` | Reusable scannable acca-builder row used across all category pages. |
| Category sidebar | `src/components/CategorySidebar.astro` | Search box + Popular Leagues + International Games. |

## Design system

Brand tokens live in `src/layouts/BaseLayout.astro` `:root`. The Oddstips live palette (extracted from the live site stylesheet) sits alongside the legacy navy/gold tokens:

- `--ot-brand-blue` `#1e73be` (primary)
- `--ot-brand-blue-dark` `#1c67ab` (hover / dark text)
- `--ot-brand-blue-soft` `#afc8df` (borders, dashed states)
- `--ot-brand-blue-muted` `#5f91bf` (labels, dt text)
- `--ot-brand-orange` `#f56300` (accents, CTAs, odds pill)
- `--ot-brand-orange-soft` `#fde2cc` (high-intensity chip background)

Hub heroes use the brand-blue gradient with a subtle dot pattern + orange radial accent (top right). CTAs use brand orange. Editorial body copy uses brand-blue h2 underlines and orange bullet dots.

## Data sources

| Source | Helper | Used by |
| --- | --- | --- |
| `getCategory(slug, postLimit)` | `src/lib/graphql.ts` | Football, Tennis, EPL hubs |
| `getCategoryPostTitles(slug, limit)` | `src/lib/graphql.ts` | Homepage's 5 "Latest [sport]" sections |
| `getInternationalTips(limit)` | `src/lib/graphql.ts` | Football page "Today's Top International Matches" |
| `getLatestPosts(limit)` | `src/lib/graphql.ts` | Catch-all router static paths |
| `getPost(slug)` | `src/lib/graphql.ts` | Single tip page |
| Local fallback IA | `src/lib/siteNav.ts` | Site navigation (sports, leagues, countries, regions) extracted from live HTML |
| Local fallback SEO copy | `src/lib/categorySeoCopy.ts` | Dev preview when ACF empty / WP unreachable |
| Local fallback fixtures | `src/lib/relatedTips.ts` | Dev preview of EPL coupons, international matches, tennis matches |
| Local fallback top divisions | `src/lib/topDivisions.ts` | Not currently rendered (kept for future use) |

## ACF Pro: what is wired up

### Category taxonomy (LIVE on staging)

| ACF field | GraphQL shape | Position on page |
| --- | --- | --- |
| `category_top_seo_text` (WYSIWYG) | `category.categoryTopSeoText.categoryTopSeoTextEditor` | Under H1 in the hero / cat-header |
| `category_bottom_seo_text` (textarea) | `category.categoryBottomSeoText.categoryBottomSeoText` | Under the tips list |

The frontend reads ACF first, falls back to `categorySeoCopy.ts`, falls back to hardcoded defaults. When you fill the field in WP, it wins.

### Tip posts (NOT YET WIRED — Codex TODO #1)

Planned field group (location: Post in tip categories):

| ACF field | Replaces in | Frontend reads via |
| --- | --- | --- |
| `event_description` (text) | "Event" body section | `summary.event` |
| `kickoff` (datetime) | "Start Time" body section | `summary.kickoff` |
| `game_flow` (select Tactical \| Open \| Frantic) | "Game-Flow" body section | `summary.gameFlow` |
| `first_goal` (select Early \| Mid \| Late) | "First Goal" body section | `summary.firstGoal` |
| `source_of_first_goal` (text) | "Source Of First Goal" body section | `summary.sourceOfFirstGoal` |
| `risk_of_injuries` (select Low \| Medium \| High) | "Risk Of Injuries" body section | `summary.riskOfInjuries` |
| `corner_count` (select Low \| Medium \| High) | "Corner Count" body section | `summary.cornerCount` |
| `bookings` (select Low \| Medium \| High) | "Bookings" body section | `summary.bookings` |
| `penalties_awarded` (select Unlikely \| Possible \| Likely) | "Penalties Awarded" body section | `summary.penaltiesAwarded` |
| `key_area` (text) | "Key Area" body section | `summary.keyArea` |
| `best_bet` (text) | "Best Bet / OddsTips Top Value Bet" | `summary.tip` |
| `odds_at_publication` (number, 2dp) | "Bet365 Odds At Time Of Publication" | `summary.odds` |
| `affiliate_url` (url) | First Bet365 link in body | `bet365Url` |

Once these land, `src/lib/tips.ts` HTML scraping can be deleted; `summarizeTip()` becomes a thin pass-through over the ACF fields. The `cleanTipContentHtml()` function in the same file is also dead code once ACF lands (currently strips the labelled blocks from the body HTML so the lede renders clean).

### Bookmaker review (NOT YET WIRED — Codex TODO #7)

`src/pages/reviews/[slug].astro` currently has Bet365 and William Hill hardcoded as fixtures. Move to ACF Pro field group on a `bookmaker` CPT:
- bonus (group: headline, code, terms, wagering, expiry)
- rating (number)
- tagline, established, license, min deposit, payout
- payments (repeater)
- pros (repeater), cons (repeater)
- scores (repeater: label + value)
- sections (flexible content: id + title + body)

## What still needs to happen — Codex TODO list

Ordered by priority for getting staging live and stable.

### 🚨 Build & deploy stability (do first)

1. **Unblock the Cloudflare Pages build** — see "Why the first deploy failed" above. Either patch the catch-all to a priority-only `getStaticPaths` (quick) or move to `@astrojs/cloudflare` SSR (proper). Either way, also delete the legacy `src/pages/category/[slug].astro` + `src/pages/tips/[slug].astro` routes (they walk every WP post/category on top of the catch-all doing the same).
2. **Retry-with-backoff in `wpGraphQL()`** in `src/lib/graphql.ts`. Wrap the `fetch` so transient `ECONNRESET` / `5xx` get up to 3 retries with 1s/2s/4s backoff before bubbling. Single-line resilience win for both build time and SSR.

### Data wiring

3. **Tip post ACF field group** + `getPost` query extension + drop HTML scraping. See ACF table above. Once this lands, `src/lib/tips.ts` `summarizeTip()` becomes a thin pass-through over ACF fields and `cleanTipContentHtml()` is dead code.
4. **Real related-tips query** (`TipPostPage.astro`). Currently uses `placeholderRelatedTips` when WP returns nothing. Add a WP query for same category, same kickoff date, exclude current post (identified by `categories.nodes.slug`, kickoff via the new ACF `kickoff` field).
5. **Today's-internationals filter**. `getInternationalTips()` in `graphql.ts` probes 4 candidate categories — verify the correct slug on Paul365 and add a `where: { dateQuery: { after: ..., before: ... } }` for today only.
6. **Sport hub routing for cricket / basketball / darts**. Simplest: route any sport-parent category not already mapped through `TennisHubPage`. Add to `categoryFallbacks` and `priorityCategoryRoutes` in the catch-all.
7. **Pagination on category pages**. Live shows 50 per page with `/<slug>/page/N/`. Currently we fetch 30 once. Extend `getCategory` to accept `after` cursor and add pagination links to `CategoryTipsPage`.

### Design polish & content

8. **Date rail wire-up**. `src/components/DateRail.astro` is visual only and currently unused after the recent redesign but the component exists. Either drop it or wire it to filter `getCategory` posts by ACF `kickoff` date.
9. **Bookmaker review ACF** (TODO #7 in original list). Move `src/lib/bookmakers.ts` data to ACF on a `bookmaker` CPT.
10. **Featured images on post cards**. When a WP post has a featured image, surface it on the homepage "Latest [sport] tips" cards.
11. **Search results page**. Hero + sidebar search both `GET /?s=…`. Either a `pages/search.astro` route or rely on `?s=` on the homepage with conditional render.
12. **Yoast SEO meta verification**. `Seo.astro` already reads `post.seo` / `category.seo` from queries. Spot-check each route emits correct title/description/canonical/OG.

## Known quirks

- **Staging WP intermittently slow.** Cloudways DB hits 500/504 on bulk category queries (50 posts with content). Frontend gracefully falls back to local placeholder data on errors so dev preview keeps working. This is why TODO #5 (SSR + edge caching) matters before going live across all categories.
- **GraphQL introspection disabled** on both production and staging. Probe queries instead of relying on `__schema`.
- **Astro CSS scoping cache.** During development, full-file rewrites can leave Vite serving stale CSS hashes. If a component renders unstyled, restart the dev server (Ctrl+C, `npm run dev` again).
- **Two ACF field types use different inner-field names.** `category_top_seo_text` (wp_editor) exposes value via `categoryTopSeoTextEditor`. `category_bottom_seo_text` (textarea) exposes value via `categoryBottomSeoText` (same as the field). Watch this when adding more ACF fields.
- **Email-style links in WP content.** The body of WP tip posts contains `&pound;` entities; `decodeHtml()` in `src/lib/tips.ts` decodes these to `£` for `parseReturns()` to extract stake/profit values.

## File map (touched / added in this design pass)

```
src/
  layouts/BaseLayout.astro           ← nav rebuild, mobile drawer, brand tokens
  components/
    TipPostPage.astro                ← redesigned: hero, signals grid, bet panel, FAQs
    CategoryTipsPage.astro           ← EPL + league hub template
    FootballHubPage.astro            ← /football/ landing
    TennisHubPage.astro              ← /tennis/ landing  (NEW)
    CategorySidebar.astro            ← shared right rail  (NEW)
    CouponRow.astro                  ← scannable acca row  (NEW)
    PostListItem.astro               ← title-only post row  (NEW)
    RelatedTips.astro                ← redesigned with brand styling
    BookmakerReviewPage.astro        ← bookmaker review template
  pages/
    index.astro                      ← homepage rebuild
    [...path].astro                  ← catch-all with TennisHubPage routing
    free-bets.astro
    reviews/[slug].astro
  lib/
    graphql.ts                       ← ACF SEO fields, getCategoryPostTitles, getInternationalTips
    tips.ts                          ← extractTime, cleanOdds, parseReturns, splitTipBody helpers
    siteNav.ts                       ← static site IA (sports, leagues, countries)  (NEW)
    categorySeoCopy.ts               ← dev-preview SEO copy fallback  (NEW)
    relatedTips.ts                   ← placeholder fixtures: EPL, tennis, international
    topDivisions.ts                  ← 27-country top-division map (currently unused)  (NEW)
    bookmakers.ts                    ← bookmaker review fixtures (extracted from page for static-paths safety)  (NEW)
    placeholders.ts                  ← global single-post / category placeholders
HANDOFF.md                           ← this file  (NEW)
CLAUDE.md                            ← repo overview + ACF field plan
```
