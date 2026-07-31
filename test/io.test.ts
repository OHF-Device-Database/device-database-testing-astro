import { describe, test, vi } from "vitest";

import {
	IoHeaderContentRange,
	IoHeaderLink,
	IoHeadersCaching,
	searchParameters,
} from "../src/io";

vi.mock("astro:env/server", () => ({ API_AUTHORITY: "https://example.com" }));

describe("IoHeaderLink", () => {
	test("parses complete link header", (t) => {
		const result = IoHeaderLink.parse(
			`<https://example.com/api/items?size=20>; rel="first", <https://example.com/api/items?page=972&size=20>; rel="last", <https://example.com/api/items?page=1&size=20>; rel="next"`,
		);
		t.expect(result).toEqual({
			first: "https://example.com/api/items?size=20",
			last: "https://example.com/api/items?page=972&size=20",
			next: "https://example.com/api/items?page=1&size=20",
		});
	});

	test("parses header without optional next", (t) => {
		const result = IoHeaderLink.parse(
			`<https://example.com/api/items?size=20>; rel="first", <https://example.com/api/items?page=972&size=20>; rel="last"`,
		);
		t.expect(result).toEqual({
			first: "https://example.com/api/items?size=20",
			last: "https://example.com/api/items?page=972&size=20",
		});
	});

	test("rejects header missing required rels", (t) => {
		const result = IoHeaderLink.safeParse(
			`<https://example.com/api/items?size=20>; rel="first"`,
		);
		t.expect(result.success).toBe(false);
	});

	test("rejects malformed segment", (t) => {
		const result = IoHeaderLink.safeParse("not a link header");
		t.expect(result.success).toBe(false);
	});
});

describe("IoHeaderContentRange", () => {
	test("parses range with numeric total", (t) => {
		const result = IoHeaderContentRange("items").parse("items 0-20/19454");
		t.expect(result).toEqual({
			start: 0,
			end: 20,
			total: 19454,
		});
	});

	test("rejects unknown total", (t) => {
		const result = IoHeaderContentRange("bytes").safeParse("bytes 200-1000/*");
		t.expect(result.success).toBe(false);
	});

	test("rejects mismatched unit", (t) => {
		const result = IoHeaderContentRange("items").safeParse("bytes 0-20/100");
		t.expect(result.success).toBe(false);
	});

	test("rejects malformed range", (t) => {
		const result = IoHeaderContentRange("items").safeParse("garbage");
		t.expect(result.success).toBe(false);
	});
});

describe("IoHeadersCaching", () => {
	describe("cache-control", () => {
		test("extracts max-age from simple header", (t) => {
			const result = IoHeadersCaching.parse({
				"cache-control": ["max-age=3600"],
			});
			t.expect(result["cache-control"]).toEqual({
				maxAge: 3600,
			});
		});

		test("extracts max-age from compound header", (t) => {
			const result = IoHeadersCaching.parse({
				"cache-control": ["public, max-age=600, s-maxage=1200"],
			});
			t.expect(result["cache-control"]).toEqual({
				maxAge: 600,
			});
		});

		test("returns undefined maxAge when directive is absent", (t) => {
			const result = IoHeadersCaching.parse({
				"cache-control": ["no-cache, no-store"],
			});
			t.expect(result["cache-control"]).toEqual({
				maxAge: undefined,
			});
		});

		test("is optional", (t) => {
			const result = IoHeadersCaching.parse({});
			t.expect(result["cache-control"]).toBeUndefined();
		});
	});

	describe("last-modified", () => {
		test("coerces HTTP-date string to Date", (t) => {
			const result = IoHeadersCaching.parse({
				"last-modified": ["Thu, 01 Dec 2020 16:00:00 GMT"],
			});
			t.expect(result["last-modified"]).toEqual(
				new Date("2020-12-01T16:00:00.000Z"),
			);
		});

		test("coerces ISO date string to Date", (t) => {
			const result = IoHeadersCaching.parse({
				"last-modified": ["2023-06-15T12:30:00Z"],
			});
			t.expect(result["last-modified"]).toEqual(
				new Date("2023-06-15T12:30:00.000Z"),
			);
		});

		test("is optional", (t) => {
			const result = IoHeadersCaching.parse({});
			t.expect(result["last-modified"]).toBeUndefined();
		});

		test("rejects invalid date string", (t) => {
			const result = IoHeadersCaching.safeParse({
				"last-modified": ["not-a-date"],
			});
			t.expect(result.success).toBe(false);
		});
	});

	test("parses both headers together", (t) => {
		const result = IoHeadersCaching.parse({
			"cache-control": ["public, max-age=300"],
			"last-modified": ["Wed, 21 Oct 2015 07:28:00 GMT"],
		});
		t.expect(result["cache-control"]?.maxAge).toBe(300);
		t.expect(result["last-modified"]).toEqual(
			new Date("2015-10-21T07:28:00.000Z"),
		);
	});
});

describe("queryToParams", () => {
	test("sets scalar string value", (t) => {
		const params = searchParameters({ key: "value" });
		t.expect(params.get("key")).toBe("value");
	});

	test("sets scalar number value", (t) => {
		const params = searchParameters({ page: 3 });
		t.expect(params.get("page")).toBe("3");
	});

	test("appends iterable string values", (t) => {
		const params = searchParameters({ tag: ["a", "b", "c"] });
		t.expect(params.getAll("tag")).toEqual(["a", "b", "c"]);
	});

	test("appends iterable number values", (t) => {
		const params = searchParameters({ id: [1, 2] });
		t.expect(params.getAll("id")).toEqual(["1", "2"]);
	});

	test("handles mixed scalar and iterable values", (t) => {
		const params = searchParameters({ page: 1, size: 20, tag: ["x", "y"] });
		t.expect(params.get("page")).toBe("1");
		t.expect(params.get("size")).toBe("20");
		t.expect(params.getAll("tag")).toEqual(["x", "y"]);
	});
});
