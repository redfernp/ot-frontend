# Oddstips Frontend - Claude Code Handoff

This document is the current technical handoff for Claude Code to continue the Oddstips Astro frontend work.

Last updated: 2026-05-26

## Current State

- Repo: `https://github.com/redfernp/ot-frontend`
- Local project: `C:\Users\jpred\Documents\Oddstips\paul365\ot-frontend`
- Frontend staging: `https://ot-frontend.pages.dev/`
- WordPress staging: `https://wordpress-514209-5717601.cloudwaysapps.com/`
- WPGraphQL staging: `https://wordpress-514209-5717601.cloudwaysapps.com/graphql`
- Latest pushed commit: `45d3229 Retry Cloudflare Pages deploy`
- Latest functional commit: `90d1e11 Unify category listing date rows`

The Cloudflare Pages deploy for `45d3229` succeeded. The previous deploy for `90d1e11` failed once because WPGraphQL returned `415 Unsupported Media Type` during `getPages()` in `src/pages/[...path].astro`. A retry deploy with no code changes passed, so treat that as a transient WordPress or Cloudways response unless it repeats.

Do not copy credentials into commits or docs. Use local `.env` and Cloudflare Pages env vars for:

- `WPGRAPHQL_ENDPOINT`
- `WP_BASIC_AUTH_USER`
- `WP_BASIC_AUTH_PASSWORD`
- `PUBLIC_SITE_URL`

## Local Commands

On Windows PowerShell, prefer `npm.cmd` if `npm.ps1` is blocked.

```powershell
cd C:\Users\jpred\Documents\Oddstips\paul365\ot-frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4341
npm.cmd run build
```

Important local URLs:

- `http://127.0.0.1:4341/`
- `http://127.0.0.1:4341/free-bets/`
- `http://127.0.0.1:4341/about/`
- `http://127.0.0.1:4341/privacy/`
- `http://127.0.0.1:4341/football/`
- `http://127.0.0.1:4341/football/united-kingdom/england-premier-league/?date=2026-05-19`
- `http://127.0.0.1:4341/tennis/`
- `http://127.0.0.1:4341/tennis/wta-strasbourg/`
- `http://127.0.0.1:4341/cricket/`
- `http://127.0.0.1:4341/cricket/indian-premier-league/`
- `http://127.0.0.1:4341/snooker/`
- `http://127.0.0.1:4341/snooker/snooker-900-2026/`
- `http://127.0.0.1:4341/basketball/`
- `http://127.0.0.1:4341/basketball/argentina-liga-nacional/`
- `http://127.0.0.1:4341/darts/`
- `http://127.0.0.1:4341/darts/premier-league-darts-2026/`

## What Has Been Built

### Free Bets Page

File: `src/pages/free-bets.astro`

Status: standalone Astro page. It does not source content from GraphQL.

User requirements already implemented:

- Use the offers and links from the sister site temporarily.
- Do not mention EveryTip or the sister site on the Oddstips page.
- Put the exact advertising terms under each offer.
- Bet365 exact required text is present under `Bet £10 & Get £30 in Free Bets`.
- Keep compliance text visible inside each offer card.
- Page copy has been rewritten to be conversion focused.

Preserve this rule: offer terms must sit in the same card as the offer headline and CTA. Do not move terms into an accordion, footnote, hidden tooltip, or separate table column.

### Generic WordPress Pages

Files:

- `src/pages/[...path].astro`
- `src/components/GenericPage.astro`
- `src/lib/graphql.ts`
- `src/lib/cmsContent.ts`

Status: catch-all routes render WordPress pages such as `/about/`, `/privacy/`, `/contact/`, `/terms-of-service/`, `/safer-gambling/`, and other uncategorised pages returned by `getPages()`.

The WordPress media URL rewrite lives in `src/lib/cmsContent.ts`. It rewrites staging upload URLs to the public Oddstips upload origin so images like the Oddstips Facebook page image render properly.

### Footer Legal Text

File: `src/layouts/BaseLayout.astro`

Status: footer contains the exact legal and advertising disclosure text supplied by the user. Do not paraphrase without explicit approval.

### Category Sidebar Promo

File: `src/components/CategorySidebar.astro`

Status: category pages include a Bet365 promo block above the sidebar search. Search has been reduced so it is no longer huge on desktop.

Preserve:

- `#Ad · New customers`
- `Bet £10 & Get £30 in Free Bets`
- `Claim with Bet365`
- exact Bet365 ad terms
- `18+ · BeGambleAware.org · GamCare.org.uk`

### Date Picker And Listing Rows

Files:

- `src/components/DateRail.astro`
- `src/components/CouponRow.astro`
- `src/components/FootballHubPage.astro`
- `src/components/TennisHubPage.astro`
- `src/components/CategoryTipsPage.astro`
- `src/lib/tips.ts`

Status:

- Category listing rows now display event date plus event time.
- `CouponRow` owns the event date through `extractEventDate(post)`.
- The row uses the same event date for `data-tip-date` and for the visible date badge.
- `DateRail` filters rows client-side using `data-tip-date`.
- Explicit `?date=YYYY-MM-DD` URLs are authoritative. If there are no tips on that date, the page shows `0 tips` and an empty message instead of jumping to another date.
- Football hub, tennis and other sport hubs, and category pages now use the same `CouponRow` listing design.

Live verification completed:

- `https://ot-frontend.pages.dev/football/united-kingdom/england-premier-league/?date=2026-05-19`
- Active date: `2026-05-19`
- Visible count: `2 tips`
- Visible rows:
  - `Tue 19 May`, `20:15`, `Chelsea v Tottenham`
  - `Tue 19 May`, `19:30`, `Bournemouth v Man City`

## Current Architecture

### Astro

The project is a static Astro build:

- `astro.config.mjs` uses `output: "static"`.
- Cloudflare Pages runs `npm run build`.
- WordPress is fetched at build time through WPGraphQL.

There is no Cloudflare adapter yet. If route volume grows, the likely future move is `@astrojs/cloudflare` with server or hybrid rendering and edge caching.

### Route Map

- `src/pages/index.astro`: homepage
- `src/pages/free-bets.astro`: standalone compliant free bets page
- `src/pages/reviews/[slug].astro`: hardcoded bookmaker review route
- `src/pages/test-sport-tips.astro`: test/proof page for sport data
- `src/pages/[...path].astro`: WordPress URL catch-all for category pages, selected tip posts, and generic WordPress pages

### Main Components

- `BaseLayout.astro`: header, nav, footer, SEO shell, global design tokens
- `FootballHubPage.astro`: `/football/`
- `TennisHubPage.astro`: simple sport hub template, currently reused by tennis, cricket, snooker, darts, basketball parent sport pages
- `CategoryTipsPage.astro`: event or league category page
- `TipPostPage.astro`: individual tip page
- `CouponRow.astro`: uniform category listing row
- `DateRail.astro`: client-side date selector
- `CategorySidebar.astro`: promo card, search, league links
- `GenericPage.astro`: catch-all generic WordPress page template
- `BookmakerReviewPage.astro`: review template
- `Seo.astro`: Yoast-aware meta output

### Data Helpers

- `src/lib/graphql.ts`: WPGraphQL client and queries
- `src/lib/tips.ts`: extracts fixture, event date, time, pick, odds, returns, and signals from Paul365 post HTML
- `src/lib/cmsContent.ts`: rewrites CMS image URLs and normalises WP content
- `src/lib/siteNav.ts`: static navigation and league IA
- `src/lib/categorySeoCopy.ts`: fallback category copy
- `src/lib/relatedTips.ts`: local fallback fixture data
- `src/lib/bookmakers.ts`: hardcoded review fixture data

## Known Technical Notes

### WPGraphQL Flakiness

Cloudways or WordPress can occasionally return transient failures during static build. Known examples:

- `415 Unsupported Media Type` during `getPages()`
- historical `ECONNRESET` or slow responses on bulk route builds

Current `wpGraphQL()` already includes retry/backoff for fetch errors and `5xx`, but it does not retry `415`. Do not blindly retry every `4xx`, because real GraphQL or auth problems should fail loudly. If `415` repeats, inspect response body first and then consider a narrow retry for `415` only.

Recommended improvement:

- Add non-secret diagnostic context to non-OK WPGraphQL errors, including status, status text, operation name if available, and the first 300 to 500 chars of response text.
- Add explicit `Accept: application/json` header.
- Consider a narrow one-time retry for `415` if the response body indicates a transient server or proxy issue.

### Event Date Source

Right now event dates are scraped from:

1. post title, such as `19-05-2026`
2. `Start Time` block in post content
3. full content fallback

This is good enough for the staging test pages, but it is not the long-term data model. The proper fix is ACF fields for event date/time.

### Encoding Cleanup

Some older helper text shows mojibake in `tips.ts` and old docs, such as `Â£`. Be careful when cleaning this. Prefer UTF-8 and verify the rendered output. Do not change compliance wording unless the user requests it.

### `localhost` vs `127.0.0.1`

Use `127.0.0.1:4341` for browser checks. `localhost:4341` previously hit an Astro 404 in the in-app browser while `127.0.0.1:4341` worked.

## Full Technical Plan For Claude Code

Work in this order.

### Phase 1 - Baseline Verification

1. Run `git status --short`.
2. Run `npm.cmd run build`.
3. Start dev server on `127.0.0.1:4341`.
4. Browser-check these pages on desktop and mobile widths:
   - `/free-bets/`
   - `/football/`
   - `/football/united-kingdom/england-premier-league/?date=2026-05-19`
   - `/cricket/?date=2026-05-18`
   - `/tennis/?date=2026-05-19`
   - `/about/`
   - `/privacy/`
5. Confirm the deployed Cloudflare check is green before making further deployment changes.

Acceptance:

- Local build passes.
- No row text overlap on mobile.
- Explicit date URLs stay on their date.
- Empty dates show a useful empty state.

### Phase 2 - Uniform Category Listing Design

Goal: make every category-style listing feel like one product, regardless of sport.

Current foundation is `CouponRow`. Keep it as the single row component, or extract a wrapper section component if useful.

Tasks:

1. Audit `FootballHubPage.astro`, `TennisHubPage.astro`, and `CategoryTipsPage.astro` for duplicated list-section header markup.
2. Consider extracting `TipListSection.astro` with:
   - eyebrow
   - heading
   - count label
   - empty text
   - row slot or posts prop
3. Keep `CouponRow` as the one reusable listing row:
   - event date and time
   - fixture
   - tipster pick
   - bookmaker and odds
   - CTA
4. Improve responsive layout:
   - desktop row should scan left to right
   - mobile row should keep date/time as the left anchor
   - fixture and pick must wrap cleanly
   - odds and CTA must not overlap or squeeze text
5. Test all sport pages listed above.

Acceptance:

- All sport and category listings use the same row design.
- Desktop and mobile layouts are readable without horizontal overflow.
- Date/time display is present wherever an event date can be extracted.

### Phase 3 - Date Picker Hardening

Goal: make the date rail obviously reliable to users.

Tasks:

1. Keep explicit URL date handling in `DateRail.astro`.
2. Add visible selected-date context if useful, for example a small label in list headers like `Showing tips for Tue 19 May`.
3. Ensure `DateRail` works with multiple sections on the same page, especially football hub internationals plus all predictions.
4. Check that counts update per section.
5. Consider preserving query params other than `date` in `syncDateQuery()`.

Acceptance:

- Clicking dates updates URL and row visibility.
- Reloading a date URL preserves the date.
- Empty dates do not look broken.
- Multiple list sections update independently.

### Phase 4 - Free Bets Page Design Polish

Goal: keep compliance intact while improving conversion.

Do not source this page from GraphQL. Keep it standalone in Astro.

Tasks:

1. Review `src/pages/free-bets.astro` on mobile and desktop.
2. Preserve exact ad terms under each offer.
3. Do not mention EveryTip.
4. Keep CTA hierarchy clear.
5. Make comparison cards/table more scan-friendly if needed:
   - bookmaker
   - offer headline
   - exact terms
   - CTA
   - rating or key benefit
6. Keep safer gambling and 18+ visible.

Acceptance:

- Terms are never hidden.
- Bet365 exact wording remains unchanged.
- No EveryTip reference appears in rendered HTML.

### Phase 5 - Generic Page Template Polish

Goal: WordPress pages not covered by sport/tip templates should render cleanly.

Tasks:

1. Audit `/about/`, `/privacy/`, `/contact/`, `/terms-of-service/`, `/safer-gambling/`.
2. Improve typography inside `GenericPage.astro`:
   - headings
   - paragraphs
   - lists
   - images
   - links
   - tables if any
3. Ensure WP media URL rewrites still work through `cmsContent.ts`.
4. Confirm Yoast metadata renders through `Seo.astro`.

Acceptance:

- Generic pages do not look like raw WP content pasted into the app.
- Images render from the public Oddstips upload origin.
- Legal pages remain readable on mobile.

### Phase 6 - Data Model Upgrade With ACF

Goal: stop scraping post HTML for structured tip data.

Add or request these ACF fields on tip posts:

- `event_description` text
- `event_date` date picker or date-time picker
- `event_time` time picker, or use one `kickoff` date-time picker
- `game_flow` select: `Tactical`, `Open`, `Frantic`
- `first_goal` select: `Early`, `Mid`, `Late`
- `source_of_first_goal` text
- `risk_of_injuries` select: `Low`, `Medium`, `High`
- `corner_count` select: `Low`, `Medium`, `High`
- `bookings` select: `Low`, `Medium`, `High`
- `penalties_awarded` select: `Unlikely`, `Possible`, `Likely`
- `key_area` text
- `best_bet` text
- `odds_at_publication` number
- `bookmaker_name` text or relationship
- `affiliate_url` URL

Frontend tasks after ACF is exposed in WPGraphQL:

1. Extend `WpPost` type in `src/lib/graphql.ts`.
2. Extend `getPost()`, `getCategory()`, child category post queries, related post query, and homepage title queries where needed.
3. Update `summarizeTip()` in `src/lib/tips.ts` to prefer ACF fields.
4. Only keep HTML scraping as fallback until all existing posts are populated.
5. Eventually remove `cleanTipContentHtml()` and brittle label parsing.

Acceptance:

- Date rail uses ACF event date, not parsed title text.
- Coupon rows use ACF kickoff time.
- Tip pages use ACF fields for the match signal grid.
- Old HTML parsing remains only as a temporary fallback.

### Phase 7 - Build And Deployment Stability

Goal: avoid Cloudflare build failures caused by too much WordPress traffic.

Short-term plan:

1. Keep `getStaticPaths()` restricted to priority sports, priority league pages, priority tip pages, and generic WP pages.
2. Avoid generating every WP post and every category at build time.
3. Add better WPGraphQL failure diagnostics.
4. If `415` repeats, add a targeted retry only after inspecting response body.

Long-term plan:

1. Move to `@astrojs/cloudflare`.
2. Use server or hybrid rendering for long-tail category and tip pages.
3. Cache rendered WordPress responses at Cloudflare.
4. Keep critical high-traffic pages prerendered if desired.

Acceptance:

- Cloudflare Pages build stays under time limits.
- Transient WP failures do not take down every deploy.
- Long-tail pages can be served without generating hundreds of static files during build.

### Phase 8 - Related Tips And Internal Linking

Goal: make pages useful for users and stronger for SEO.

Tasks:

1. Replace placeholder related tips with real WPGraphQL related posts.
2. Query posts from the same category, exclude current post.
3. Prefer same event date once ACF event date exists.
4. Add links back to sport and league hub pages.
5. Check breadcrumbs from Yoast/WPGraphQL.

Acceptance:

- Tip pages show real related tips.
- No placeholder fixture appears when live data is available.
- Internal links match live Oddstips URL structure.

## Design Requirements To Preserve

- Use the actual app experience as the first screen, not a marketing landing page.
- Do not create decorative card-heavy layouts where a dense betting product UI is better.
- Keep category listings dense, scannable, and consistent.
- Do not use visible in-app explainer copy such as "this table is compliant" or "exact terms appear below".
- Avoid oversized search UI in sidebars.
- Keep cards at 8px radius or less unless matching existing design tokens.
- Avoid text overlap on mobile.
- Do not let buttons or labels resize the row layout unexpectedly.
- Use the established Oddstips palette:
  - brand blue: `#1e73be`
  - dark blue: `#1c67ab`
  - orange: `#f56300`
  - pale blue borders: `#afc8df`

## User-Specific Instructions To Remember

- The free bets page must be standalone, not GraphQL-driven.
- The Oddstips page must not mention EveryTip.
- The free bet offers may reuse sister-site offers and links temporarily.
- Exact ad terms must appear under the offer text.
- The footer legal text must stay exactly as supplied unless the user approves changes.
- Use only live staging-site data for real test pages.
- Category listings should be uniform across all sports.
- Date picker should use the same event date shown in the listing row.

## Deployment Checklist

Before pushing:

1. `git status --short`
2. `npm.cmd run build`
3. Browser QA local pages.
4. Commit with a clear message.
5. Push to `main`.
6. Check GitHub Cloudflare Pages check run.
7. Verify live:
   - `https://ot-frontend.pages.dev/free-bets/`
   - `https://ot-frontend.pages.dev/about/`
   - `https://ot-frontend.pages.dev/football/united-kingdom/england-premier-league/?date=2026-05-19`

If Cloudflare fails with a WPGraphQL transient error but local build passes, retry once. If it fails twice, inspect and fix the GraphQL client or reduce build-time WP traffic.
