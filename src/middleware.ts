import { NOINDEX } from "astro:env/server";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_, next) => {
	const response = await next();

	if (NOINDEX) {
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
	}

	return response;
});
