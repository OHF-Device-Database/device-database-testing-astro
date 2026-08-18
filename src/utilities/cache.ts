import type { IoHeadersCaching } from "../io";

// once max-age expires, serve the stale page instantly for up to a day while
// revalidating in the background, instead of blocking a visitor on upstream
const SWR_SECONDS = 86_400;

export const cachePolicy = (headers: IoHeadersCaching) => ({
	// exact optional property buffoonery
	...(typeof headers["cache-control"]?.maxAge !== "undefined"
		? { maxAge: headers["cache-control"]?.maxAge, swr: SWR_SECONDS }
		: {}),
	...(typeof headers["last-modified"] !== "undefined"
		? { lastModified: headers["last-modified"] }
		: {}),
});
