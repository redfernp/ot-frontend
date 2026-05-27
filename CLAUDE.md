# Oddstips Frontend (ot-frontend) — Project Handoff

Astro headless frontend for Oddstips, powered by WordPress + WPGraphQL.

## Current Continuation Plan

Read `HANDOFF.md` first. It contains the current Claude Code handoff, latest deployed commits, live verification notes, user requirements, and the full technical plan for the next coding/design pass.

## Repo & Local

- Repo: https://github.com/redfernp/ot-frontend
- Local path: `C:\Users\jpred\Documents\Oddstips\paul365\ot-frontend`
- Run local dev:
  ```powershell
  cd C:\Users\jpred\Documents\Oddstips\paul365\ot-frontend
  npm run dev -- --host 127.0.0.1 --port 4323
  ```

## Hosted

- Staging frontend (Cloudflare Pages): https://ot-frontend.pages.dev/
- Staging WordPress (Cloudways): https://wordpress-514209-5717601.cloudwaysapps.com/
- Staging WPGraphQL: https://wordpress-514209-5717601.cloudwaysapps.com/graphql

## Latest Commits

- `473f261` Add category date rail and related tip links
- `3e627d1` Add detailed tip match signals
- `c6150dd` Improve tip post match template
- `b6e293d` Preserve WordPress category and tip URLs
- `9a0c9ec` Add coupon-style category tip cards

## Preview URLs (local)

- http://127.0.0.1:4323/
- http://127.0.0.1:4323/football/
- http://127.0.0.1:4323/football/united-kingdom/england-premier-league/
- http://127.0.0.1:4323/sunderland-v-chelsea-24-05-2026-free-fixed-odds-tip-football-betting-prediction/
- http://127.0.0.1:4323/free-bets/
- http://127.0.0.1:4323/reviews/bet365/

## Architecture Map

### Pages
- `src/pages/index.astro` — homepage
- `src/pages/free-bets.astro` — free bets roundup
- `src/pages/reviews/[slug].astro` — bookmaker review (dynamic)
- `src/pages/category/[slug].astro` — legacy `/category/<slug>/` route
- `src/pages/tips/[slug].astro` — legacy `/tips/<slug>/` route
- `src/pages/[...path].astro` — catch-all for live WordPress URLs (categories + posts)

### Templates / Components
- `src/layouts/BaseLayout.astro` — site shell (header, footer, SEO, design tokens)
- `src/components/CategoryTipsPage.astro` — league hub (used for EPL etc.)
- `src/components/FootballHubPage.astro` — football landing (sub-league chooser)
- `src/components/TipPostPage.astro` — individual tip post
- `src/components/BookmakerReviewPage.astro` — bookie review body
- `src/components/TipCouponCard.astro` — 1x2 coupon row
- `src/components/DateRail.astro` — sportsbook-style date selector
- `src/components/RelatedTips.astro` — related links module
- `src/components/PostCard.astro` — generic post tile
- `src/components/Seo.astro` — Yoast-aware meta tags
- `src/components/StagingBanner.astro` — visible staging notice

### Data
- `src/lib/graphql.ts` — WPGraphQL queries (getLatestPosts, getCategory, getPost, getPage)
- `src/lib/tips.ts` — extracts structured data from Paul365 HTML (fixture, teams, kickoff, tip, odds)
- `src/lib/relatedTips.ts` — placeholder related-tip data
- `src/lib/placeholders.ts` — local-only fallback data when WPGraphQL not configured

## Design System

Tokens are declared in `BaseLayout.astro` `:root`:

| Token | Hex | Usage |
| --- | --- | --- |
| `--ot-ink` | `#0b1f3f` | Primary navy, headers, hero |
| `--ot-ink-2` | `#102f67` | Secondary navy, hover states |
| `--ot-gold` | `#d8ad55` | Active accents (date rail, ratings) |
| `--ot-green` | `#0f766e` | Picks, win highlights, primary CTAs |
| `--ot-green-2` | `#027b5b` | CTA hover |
| `--ot-danger` | `#b91c1c` | Lose, alerts |
| `--ot-bg` | `#f5f7fb` | Page background |
| `--ot-surface` | `#ffffff` | Cards, panels |
| `--ot-border` | `#e1e7ef` | Card borders, dividers |
| `--ot-text` | `#101828` | Body text |
| `--ot-muted` | `#5d697a` | Labels, captions |

Type: Inter, system fallback. h1 fluid 2rem–3.5rem.

Spacing: 8px base. Cards use 1.25rem (20px) padding, 8px radius.

## Templates Built

1. Homepage with featured pick, today's coupon, sport tiles, league chips, free-bets strip, latest articles
2. Main football category hub (sub-leagues, weekend coupon, featured leagues)
3. EPL category page (date rail, coupon list, league info teaser)
4. EPL individual tip post (hero, pick panel, summary strip, body, sticky CTA, related)
5. Free bets roundup (comparison table, offer cards, how-we-rate, FAQ)
6. Bookmaker review (rating panel, quick facts, pros/cons, anchor nav, verdict)

## SEO / URLs

Preserve live WordPress URLs exactly. Examples:
- `/football/`
- `/football/united-kingdom/england-premier-league/`
- `/sunderland-v-chelsea-24-05-2026-free-fixed-odds-tip-football-betting-prediction/`

Use Yoast metadata via WPGraphQL. Hub-and-spoke linking:
- Category pages = hubs
- Tip posts = spokes, cross-link to same-league weekend matches

## Environment

Cloudflare Pages env vars:

- `WPGRAPHQL_ENDPOINT`
- `WP_BASIC_AUTH_USER`
- `WP_BASIC_AUTH_PASSWORD`
- `PUBLIC_SITE_URL`

Use the Cloudways app URL as backend origin for now; `cms.oddstips.co.uk` is not yet provisioned.

## Writing Style

No em-dashes (—) anywhere. Use commas, semicolons, colons, parentheses, hyphens, or split sentences. Applies to copy in templates, code comments, commit messages.

## Planned ACF Pro field groups (WordPress side)

### Category SEO (location: Taxonomy = category)

- `seo_content` (WYSIWYG) - long-form editorial body shown under the post list on the category page. Replaces the current Beaver Builder Themer block. Expose via WPGraphQL for ACF as `category.acfCategorySeo.seoContent`.

The frontend already reads `category.acfCategorySeo?.seoContent` first and falls back to `src/lib/categorySeoCopy.ts` (keyed by category slug). Once the field is populated in WP and exposed via WPGraphQL ACF, the local fallback becomes dormant.

### Tip Match Signals (planned, location: Post in tip categories)

- `event_description` (text)
- `kickoff` (date_time_picker)
- `game_flow` (select: Tactical | Open | Frantic)
- `first_goal` (select: Early | Mid | Late)
- `source_of_first_goal` (text)
- `risk_of_injuries` (select: Low | Medium | High)
- `corner_count` (select: Low | Medium | High)
- `bookings` (select: Low | Medium | High)
- `penalties_awarded` (select: Unlikely | Possible | Likely)
- `key_area` (text)
- `best_bet` (text) - replaces "OddsTips Top Value Bet"
- `odds_at_publication` (number)
- `affiliate_url` (url)

This replaces the HTML scraping in `tips.ts`. Field shape mirrors what `summarizeTip()` already parses out of Paul365 HTML.

## Next Engineering Tasks

1. Confirm Cloudflare deployed latest commit
2. Designer review of local category and tip templates
3. Replace placeholder related tips with real WPGraphQL related-posts query
4. Wire date rail to filter posts by kickoff/date
5. Wire ACF Pro `seo_content` on Category taxonomy + drop local fallback
6. Replace HTML parsing in `tips.ts` with ACF fields exposed through WPGraphQL
7. Plan hybrid Astro/Cloudflare rendering so tip pages can be on-demand and cached
8. Add real bookmaker review data model (ACF: bonus, wagering, rating, pros, cons, CTA)
