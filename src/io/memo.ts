import type { IoHeadersCaching } from ".";

type Entry = { until: number; value: Promise<unknown> };
const entries = new Map<string, Entry>();

/**
 * Memoizes a fetch for as long as its upstream `cache-control: max-age`
 * allows. Concurrent callers share the in-flight promise, so a render that
 * fetches the same resource twice only hits upstream once; failures are
 * never cached.
 */
export const withUpstreamTtl = <T extends { caching: IoHeadersCaching }>(
	key: string,
	fetcher: () => Promise<T>,
): Promise<T> => {
	const existing = entries.get(key);
	if (typeof existing !== "undefined" && existing.until > Date.now()) {
		return existing.value as Promise<T>;
	}

	const value = fetcher().then((result) => {
		const maxAge = result.caching["cache-control"]?.maxAge ?? 0;
		entries.set(key, { until: Date.now() + maxAge * 1000, value });
		return result;
	});
	entries.set(key, { until: Number.POSITIVE_INFINITY, value });
	value.catch(() => entries.delete(key));

	return value;
};
