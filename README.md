# ot-frontend

Astro frontend proof-of-concept for the Oddstips WordPress headless migration.

## Purpose

This project is the staging frontend shell for Cloudflare Pages. WordPress remains the CMS and publishing engine. Astro fetches content from the staging WordPress WPGraphQL endpoint at build time.

## Cloudflare Pages Settings

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Environment variables:

- `WPGRAPHQL_ENDPOINT`
- `WP_BASIC_AUTH_USER` if staging WordPress uses basic auth
- `WP_BASIC_AUTH_PASSWORD` if staging WordPress uses basic auth
- `PUBLIC_SITE_URL`

## Crawler Policy

The site is publicly indexable as of go-live. The only paths still
flagged noindex are affiliate cloak redirectors:

- `public/robots.txt` allows everything except `Disallow: /go/`.
- `public/_headers` sets `X-Robots-Tag: noindex, nofollow` on `/go/*`
  only.
- Individual `/go/{slug}/` pages render their own `<meta name="robots"
  content="noindex,nofollow">` for belt-and-braces.

Do not commit `.env` files or production credentials.

## Template Targets

- Homepage: `/`
- Category proof-of-concept: `/category/example/`
- Tip post proof-of-concept: `/tips/example-tip/`
- Evergreen page proof-of-concept: `/free-bets/`

When WPGraphQL endpoint credentials are configured, the dynamic routes will generate from real WordPress data.
