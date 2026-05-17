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

## Staging Safety

The shell includes:

- `public/robots.txt` blocking crawlers.
- `public/_headers` with `X-Robots-Tag: noindex, nofollow`.
- A visible staging banner in the layout.

Do not commit `.env` files or staging credentials.

## Template Targets

- Homepage: `/`
- Category proof-of-concept: `/category/example/`
- Tip post proof-of-concept: `/tips/example-tip/`
- Evergreen page proof-of-concept: `/free-bets/`

When WPGraphQL endpoint credentials are configured, the dynamic routes will generate from real WordPress data.
