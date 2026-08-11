let goneSetPromise = null;

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(request.url);
  if (shouldBypass(url.pathname)) {
    return context.next();
  }

  const path = normalizePath(url.pathname);
  const slug = oneSegmentSlug(url.pathname);
  const goneSet = await loadGoneSet(env, url.origin);

  if (!goneSet.has(path) && (!slug || !goneSet.has(slug))) {
    return context.next();
  }

  return new Response(request.method === "HEAD" ? null : "Gone", {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function shouldBypass(pathname) {
  return (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/_gone/") ||
    pathname.startsWith("/wp-content/") ||
    pathname === "/favicon.svg" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/sitemap")
  );
}

function oneSegmentSlug(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return "";

  const slug = parts[0];
  if (!slug || slug.includes(".")) return "";

  return slug;
}

function normalizePath(pathname) {
  let value = String(pathname ?? "");
  try {
    if (/^https?:\/\//i.test(value)) {
      value = new URL(value).pathname;
    }
  } catch {
    // Fall through and normalize the original value.
  }

  const clean = `/${value.replace(/^\/+|\/+$/g, "")}/`;
  return clean.replace(/\/+/g, "/");
}

async function loadGoneSet(env, origin) {
  if (!goneSetPromise) {
    goneSetPromise = fetchGoneSet(env, origin).catch(() => new Set());
  }
  return goneSetPromise;
}

async function fetchGoneSet(env, origin) {
  if (!env?.ASSETS?.fetch) {
    return new Set();
  }

  const assetUrl = new URL("/_gone/oddstips-tombstones.json", origin);
  const response = await env.ASSETS.fetch(assetUrl);
  if (!response.ok) {
    return new Set();
  }

  const data = await response.json();
  const gone = new Set();

  if (Array.isArray(data.paths)) {
    for (const path of data.paths) {
      if (typeof path === "string" && path) {
        gone.add(normalizePath(path));
      }
    }
  }

  if (Array.isArray(data.slugs)) {
    for (const slug of data.slugs) {
      if (typeof slug === "string" && slug) {
        gone.add(slug);
        gone.add(normalizePath(`/${slug}/`));
        gone.add(normalizePath(`/es/pronosticos/${sourceTipSlugToSpanishSlug(slug)}/`));
      }
    }
  }

  return gone;
}

// Spanish tip URLs use a translated but deterministic form of the original
// paul365 slug. Deriving it again here means a tombstoned English source tip
// also returns 410 at its Spanish URL even after the source post has vanished
// from the build snapshot.
function sourceTipSlugToSpanishSlug(sourceSlug) {
  const suffix = "-free-fixed-odds-tip-football-betting-prediction";
  const pattern = new RegExp(
    `^(.+?)-v-(.+?)-(\\d{2}-\\d{2}-\\d{4})${suffix}$`,
    "i",
  );
  const match = String(sourceSlug).match(pattern);

  if (!match) {
    return `${sourceSlug}-pronostico`;
  }

  return `${match[1]}-contra-${match[2]}-pronostico-${match[3]}`;
}
