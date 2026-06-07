# Oddstips Frontend (ot-frontend) — Project Handoff

Astro fully-static frontend for Oddstips. Live at https://www.oddstips.co.uk.

## Architecture

Pure static prerender. Build downloads ONE JSON snapshot of all WordPress data, generates ~3900 static HTML pages from it, deploys to Cloudflare Pages. Visitors hit pure HTML at the CF edge. WordPress is never touched at runtime.

```
WordPress (Cloudways)               Cloudflare Pages
─────────────────                   ─────────────────
paul365 plugin            tips      Astro static build
publishes tip posts  ──►            getStaticPaths reads
                                    snapshot, renders
                                    ~3900 .html files
oddstips-snapshot                ▲
plugin generates                 │  1 fetch per build
tips-snapshot.json               │  (~4MB, ~1s)
at /wp-content/uploads/  ────────┘
```

**Build time: ~40 seconds** for 3956 pages. Was 15+ minutes before snapshot migration (June 2026).

## Repo & Local

- Repo: https://github.com/redfernp/ot-frontend
- Local path: `C:\Users\jpred\Documents\Oddstips\paul365\ot-frontend`
- Run local dev:
  ```powershell
  npm run dev -- --host 127.0.0.1 --port 4323
  ```
- Local build (no env = empty snapshot = only static fallback pages built):
  ```powershell
  npm run build
  ```

## Hosted

- **Live site**: https://www.oddstips.co.uk (apex 301s to www via CF Redirect Rule)
- **CF Pages project**: ot-frontend (preview URL: https://ot-frontend.pages.dev/)
- **Live WordPress**: https://wordpress-514209-2167081.cloudwaysapps.com/
- **Live WPGraphQL** (used only for menu queries at build time): same host /graphql
- **Snapshot JSON** (read at every build): same host /wp-content/uploads/tips-snapshot.json

Staging WP (`wordpress-514209-5717601.cloudwaysapps.com`) lives on the SAME Cloudways server as live (9 apps sharing 1.94GB RAM + 1 MySQL).

## WordPress plugins (custom, source under `C:\Users\jpred\Documents\Oddstips\plugin\`)

### `paul365` — tip ingestion

Fetches Bet365 XML feeds, picks tips, creates WP posts. Active on live.

- `Bet365Parser.php` — fetches feed, writes to `p_events` / `p_event_groups` / `p_participants` / `p_sports` custom tables
- `TipSelector.php` — picks one participant per event using odds-weighted random
- `paul365.php` — `paul365_post_articles()` reads custom tables, creates WP categories (Sport → Country → League hierarchy), inserts WP posts via per-sport templates in `templates/`
- `cron-runner.php` — server-cron entrypoint (parse → select → post)
- Writes `event_start` post_meta with fixture kickoff time (used by the snapshot generator)

**Cron schedule**: every 15 min via Cloudways Cron Job Management.

**Disabled with no safeguards as of June 2026 incident** (stacking instances caused PHP-FPM exhaustion). Re-enable only after adding a lock-file guard to `cron-runner.php`.

### `oddstips-snapshot` — JSON snapshot generator

Dumps every category + post + page from WP into one JSON file. Active on live.

- Output: `/wp-content/uploads/tips-snapshot.json` (~4MB, 2267 categories, 1647 posts, 18 pages at time of writing)
- Schedules itself every 30 mins via WP-Cron (but WP-Cron requires visitor traffic to fire, and live WP has zero direct visitors, so use a server cron instead)
- Admin UI: WP-admin → Tools → Oddstips Snapshot (manual Generate button)
- REST endpoint for external triggers: `POST /wp-json/oddstips/v1/generate-snapshot` with `X-OTS-Key: <SECRET>` header. `OTS_REGEN_KEY` constant defined in `wp-config.php`.
- Uses atomic file write (.tmp then rename), lock file to prevent overlapping runs
- Decodes HTML entities in titles (WP's wptexturize turns `-` into `&#8211;`; we decode back)
- Includes `eventStart` per post for accurate date filtering

## Architecture Map

### Pages
- `src/pages/index.astro` — homepage
- `src/pages/free-bets.astro` — free bets roundup
- `src/pages/reviews/[slug].astro` — bookmaker review (dynamic, from `bookmakers.ts`)
- `src/pages/reviews/index.astro` — bookmaker reviews list
- `src/pages/category/[slug].astro` — legacy `/category/<slug>/` route
- `src/pages/tips/[slug].astro` — legacy `/tips/<slug>/` route
- `src/pages/[...path].astro` — catch-all for all WP-backed URLs. `prerender = true`. `getStaticPaths()` enumerates from the snapshot.
- `src/pages/go/[slug].astro` — affiliate cloak redirector (GA4 click tracking)

### Templates / Components
- `src/layouts/BaseLayout.astro` — site shell (header, footer, SEO, design tokens, GA4)
- `src/components/CategoryTipsPage.astro` — sub-category page (league hubs)
- `src/components/FootballHubPage.astro` — football top-level + country sub-categories
- `src/components/TennisHubPage.astro` — tennis/cricket/snooker/darts/basketball hubs
- `src/components/TipPostPage.astro` — individual tip post
- `src/components/BookmakerReviewPage.astro` — bookie review body
- `src/components/CouponRow.astro` — single tip row with data-tip-date for filtering
- `src/components/TipListSection.astro` — list section with optional `groupByDate` (renders dated headers between groups)
- `src/components/DateRail.astro` — sportsbook-style date selector (client-side JS filters by date; "today + future" stacking when today's count < 20)
- `src/components/CategorySidebar.astro` — wraps `getMenu()` for popular-leagues + international-games menus
- `src/components/HubHero.astro` — shared hero header for all category pages
- `src/components/Seo.astro` — Yoast-aware meta tags
- `src/components/RelatedTips.astro` — related links module

### Data layer
- `src/lib/snapshot.ts` — fetches the JSON snapshot once per build, caches in module state, exposes accessor functions (findCategoryBySlug, postsForCategory, etc). Snapshot URL is derived from `WPGRAPHQL_ENDPOINT` (replaces /graphql with /wp-content/uploads/tips-snapshot.json).
- `src/lib/graphql.ts` — public data API (getCategory, getPost, etc). Delegates to snapshot.ts for everything except `getMenu`, which still queries WPGraphQL directly because menus aren't in the snapshot. Module-level cache means 2 menu queries per build, total.
- `src/lib/tips.ts` — extracts structured data from post HTML (fixture, teams, kickoff, tip, odds). Fallback when snapshot lacks structured data.
- `src/lib/bookmakers.ts` — bookmaker review data (rating, pros, cons, offer URLs). Production data, not migrating to ACF.
- `src/lib/affiliateLinks.ts` — affiliate slug → direct partner URL (used by /go/[slug].astro)
- `src/lib/categorySeoCopy.ts` — fallback SEO copy keyed by category slug, used when ACF SEO is empty on a category
- `src/lib/relatedTips.ts`, `src/lib/placeholders.ts` — local-only fallback data when WPGraphQL not configured

## Design System

Tokens in `BaseLayout.astro` `:root`:

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

Type: Inter, system fallback. h1 fluid 2rem-3.5rem. Spacing 8px base. Cards 1.25rem padding, 8px radius.

## SEO / URLs

WP URL structure is preserved exactly. The Astro catch-all route renders the right template based on URL pattern + WP data type.

- Categories: `/football/`, `/football/united-kingdom/england-premier-league/`
- Tip posts: `/sunderland-v-chelsea-24-05-2026-free-fixed-odds-tip-football-betting-prediction/`
- WP pages: `/about/`, `/contact/`, `/privacy/`, `/free-bets/`
- Apex `oddstips.co.uk` → 301 → www via CF Redirect Rule

## Environment

Cloudflare Pages env vars (Production scope):

- `WPGRAPHQL_ENDPOINT` (required for snapshot URL derivation + menu queries)
- `WP_BASIC_AUTH_USER`, `WP_BASIC_AUTH_PASSWORD` (live WP has no basic auth, but kept for staging compatibility)
- `PUBLIC_SITE_URL` = `https://www.oddstips.co.uk`
- `PUBLIC_GA4_ID`

WordPress side: `OTS_REGEN_KEY` constant defined in `wp-config.php` (secret for the snapshot REST endpoint).

## Cron jobs (Cloudways Application Settings → Cron Job Management)

| Cron | Schedule | Command |
| --- | --- | --- |
| Snapshot regen | `*/30 * * * *` | `curl -s -X POST -H "X-OTS-Key: <SECRET>" https://wordpress-514209-2167081.cloudwaysapps.com/wp-json/oddstips/v1/generate-snapshot` |
| CF Pages rebuild | `0 * * * *` | `curl -s -X POST <CF_PAGES_DEPLOY_HOOK_URL>` |
| paul365 tip ingestion | `*/15 * * * *` (target) | `php /home/master/applications/ahrtddwzgs/public_html/wp-content/plugins/paul365/cron-runner.php` |

End-to-end latency from Bet365 → live site: ~30 min snapshot lag + ~5 min CF Pages build = up to ~40 min.

## Writing Style

No em-dashes (—) anywhere. Use commas, semicolons, colons, parentheses, hyphens, or split sentences. Applies to copy in templates, code comments, commit messages.

## Known issues / outstanding work

- **`/wp-content/*` proxy broken** — CF Pages doesn't support cross-origin proxy redirects. Images served via `/wp-content/uploads/...` URLs will 404. Fix: change image URL rewriting in `cmsContent.ts` to point directly at `https://wordpress-514209-2167081.cloudwaysapps.com/wp-content/...` (less clean but works).
- **paul365 cron needs lock-file guard** before re-enabling. Stacking instances was the root cause of the June 2026 PHP-FPM exhaustion incident.
- **og:image asset missing site-wide**. Yoast has no opengraph-image fallback. Affects social-share cards.
- **sitemap.xml** — not generated yet. Plan for after stabilization.
- **9 apps on one Cloudways server** is a structural fragility. Long-term: isolate Oddstips to its own server.
- **Imunify360 scans** can spike CPU to 100% during full-fs sweeps (especially after server restart). Schedule scans for off-peak (3-5 UTC) once stable.

## ACF Pro field groups (active on WP, exposed in snapshot)

### Category SEO (location: Taxonomy = category)

- `category_top_seo_text` — long-form editorial body shown under H1 on category pages
- `category_bottom_seo_text` — shown below the tips list

Frontend reads `category.categoryTopSeoText.categoryTopSeoText` and `category.categoryBottomSeoText.categoryBottomSeoText` (the inner field name matches outer wrapper because the ACF field is a textarea, not a wp_editor). Falls back to `src/lib/categorySeoCopy.ts` keyed by slug if WP returns empty.

### Tip Match Signals (planned, not implemented)

Was planned to replace `tips.ts` HTML scraping with structured ACF fields per tip post. Not migrated; HTML scraping is current production approach. Leave as is unless content workflow changes.

## June 2026 incident summary (read before touching infra)

Two-day go-live incident. Key takeaways for future work:

1. **WP on 2GB Cloudways with 9 apps cannot sustain SSR on-demand queries.** Even one CF Pages worker fetching per cache miss caused MySQL connection exhaustion and PHP-FPM lockups. The snapshot architecture is the solution.
2. **The Cloudflare adapter generates `_routes.json` that fails with 100-char limit** when category/post slugs are long. We removed the adapter entirely; with `output: "static"` it's not needed.
3. **CF Pages requires cache-buster on snapshot fetches** — without `?cb=<timestamp>`, CF or upstream may serve a stale empty response.
4. **WP-Cron does not fire on headless sites** (no visitor traffic). All scheduled WP tasks need a server-level cron trigger.
5. **WordPress Address / Site Address in General Settings must stay as cloudwaysapps URL.** Changing to www.oddstips.co.uk breaks all internal WP redirects (login, AJAX, cron self-calls).
6. **Object Cache Pro / WPGraphQL Smart Cache / WP Rocket are all OFF.** Each one contributed to instability during the incident. Don't re-enable without a long stable baseline.
