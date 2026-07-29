import type { IoHeadersCaching } from "../io";

export const cachePolicy = (headers: IoHeadersCaching) => ({
	// exact optional property buffoonery
	...(typeof headers["cache-control"]?.maxAge !== "undefined"
		? { maxAge: headers["cache-control"]?.maxAge }
		: {}),
	...(typeof headers["last-modified"] !== "undefined"
		? { lastModified: headers["last-modified"] }
		: {}),
});
