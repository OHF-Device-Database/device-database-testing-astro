import type { APIRoute } from "astro";
import { NOINDEX } from "astro:env/server";
import { CACHE_POLICY, applyCdnCache } from "../lib/cache";

// Server-rendered so the body reflects the runtime NOINDEX instead of being
// baked in at build time; cached at the CDN edge like the content pages.
export const prerender = false;

// While the preview is no-indexed, disallow all crawling. For a production deploy
// (NOINDEX=false) allow everything.
const body = NOINDEX ? "User-agent: *\nDisallow: /\n" : "User-agent: *\nDisallow:\n";

export const GET: APIRoute = () => {
    const headers = new Headers({ "content-type": "text/plain; charset=utf-8" });
    applyCdnCache(headers, CACHE_POLICY.static);
    return new Response(body, { headers });
};
