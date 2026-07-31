import { describe, test, vi } from "vitest";

import {
	browseFiltersFromSearchParams,
	browseFiltersToHref,
	browseFiltersToQuery,
	browseFiltersToSearchParams,
	cleared,
	withCategoryToggled,
} from "../src/types/browse";

vi.mock("astro:env/server", () => ({ API_AUTHORITY: "https://example.com" }));

describe("browseFiltersFromSearchParams", () => {
	test("parses every dimension", (t) => {
		const filters = browseFiltersFromSearchParams(
			new URLSearchParams(
				"q=hue&category=lighting&category=cleaning&manufacturer=Signify&local=1",
			),
		);
		t.expect(filters).toEqual({
			term: "hue",
			category: new Set(["lighting", "cleaning"]),
			manufacturer: new Set(["Signify"]),
			localOnly: true,
		});
	});

	test("drops category ids the API does not know", (t) => {
		const filters = browseFiltersFromSearchParams(
			new URLSearchParams("category=sensors&category=lighting"),
		);
		t.expect(filters.category).toEqual(new Set(["lighting"]));
	});

	test("treats a blank term as absent", (t) => {
		const filters = browseFiltersFromSearchParams(
			new URLSearchParams("q=%20%20"),
		);
		t.expect(filters.term).toBeUndefined();
	});
});

describe("browseFiltersToSearchParams", () => {
	test("round-trips through the URL", (t) => {
		const params = new URLSearchParams(
			"q=hue&category=cleaning&category=lighting&manufacturer=Signify&local=1",
		);
		const roundTripped = browseFiltersToSearchParams(
			browseFiltersFromSearchParams(params),
		);
		t.expect(roundTripped.toString()).toBe(params.toString());
	});

	test("omits empty dimensions", (t) => {
		const href = browseFiltersToHref(
			browseFiltersFromSearchParams(new URLSearchParams()),
		);
		t.expect(href).toBe("/browse");
	});
});

describe("browseFiltersToQuery", () => {
	test("maps local-only to excluding online, keeping unknown connectivity", (t) => {
		const query = browseFiltersToQuery(
			browseFiltersFromSearchParams(new URLSearchParams("local=1")),
		);
		t.expect(query).toEqual({ "!connectivity": new Set(["online"]) });
	});

	test("omits empty dimensions entirely", (t) => {
		const query = browseFiltersToQuery(
			browseFiltersFromSearchParams(new URLSearchParams()),
		);
		t.expect(query).toEqual({});
	});
});

describe("modifiers", () => {
	test("withCategoryToggled adds and removes", (t) => {
		const base = browseFiltersFromSearchParams(
			new URLSearchParams("category=lighting"),
		);
		t.expect(withCategoryToggled(base, "cleaning").category).toEqual(
			new Set(["lighting", "cleaning"]),
		);
		t.expect(withCategoryToggled(base, "lighting").category).toEqual(new Set());
	});

	test("cleared drops filters but keeps the term", (t) => {
		const base = browseFiltersFromSearchParams(
			new URLSearchParams("q=hue&category=lighting&local=1"),
		);
		t.expect(cleared(base)).toEqual({
			term: "hue",
			category: new Set(),
			manufacturer: new Set(),
			localOnly: false,
		});
	});
});
