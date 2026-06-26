// Build-time search index.
//
// The site is a pure static build (no SSR), so search has to run in the
// visitor's browser. This endpoint is prerendered once at build time into
// dist/search-index.json: a lightweight list of every tip post and every
// non-empty category (sport / country / league) pulled from the snapshot.
// /search/ fetches this file once and filters it client-side.
//
// We keep each entry tiny (short keys, only the fields the results page
// renders) so the whole index stays small enough to fetch on one page load.
// ~1650 posts + ~2200 categories gzips to well under 100KB.

import type { APIRoute } from "astro";
import { loadSnapshot } from "@/lib/snapshot";

export const prerender = true;

// Pick the most specific category for a post to show as a subtitle. Posts are
// filed under Sport -> Country -> League, so the node with the longest uri is
// the deepest (most specific, e.g. "England Premier League" over "Football").
function bestCategoryLabel(nodes: { name?: string; uri?: string }[]): string {
  let best: { name?: string; uri?: string } | null = null;
  for (const node of nodes) {
    if (!node?.name) continue;
    if (!best || (node.uri?.length ?? 0) > (best.uri?.length ?? 0)) best = node;
  }
  return best?.name ?? "";
}

export const GET: APIRoute = async () => {
  const snapshot = await loadSnapshot();

  // type: "t" = tip post, "c" = category. Short keys: t=title, u=uri, s=sub,
  // d=date. The results page knows this shape.
  const items: Array<{
    type: "t" | "c";
    t: string;
    u: string;
    s?: string;
    d?: string;
  }> = [];

  if (snapshot) {
    for (const post of snapshot.posts) {
      const uri = post.uri || (post.slug ? `/${post.slug}/` : "");
      if (!post.title || !uri) continue;
      items.push({
        type: "t",
        t: post.title,
        u: uri,
        s: bestCategoryLabel(post.categories?.nodes ?? []),
        d: post.date,
      });
    }

    for (const cat of snapshot.categories) {
      if (!cat.name || !cat.uri || cat.count <= 0) continue;
      items.push({
        type: "c",
        t: cat.name,
        u: cat.uri,
        s: `${cat.count} tip${cat.count === 1 ? "" : "s"}`,
      });
    }
  }

  return new Response(JSON.stringify({ generatedAt: snapshot?.generatedAt ?? null, items }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
