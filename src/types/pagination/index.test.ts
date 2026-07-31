import { describe, test } from "vitest";

import { paginationItems } from "./index";

describe("paginationItems", () => {
	test("small page counts list every page without gaps", (t) => {
		t.expect(paginationItems(0, 3)).toEqual([
			{ gap: false, page: 0 },
			{ gap: false, page: 1 },
			{ gap: false, page: 2 },
		]);
	});

	test("distant pages collapse into gaps", (t) => {
		t.expect(paginationItems(5, 12)).toEqual([
			{ gap: false, page: 0 },
			{ gap: true },
			{ gap: false, page: 4 },
			{ gap: false, page: 5 },
			{ gap: false, page: 6 },
			{ gap: true },
			{ gap: false, page: 11 },
		]);
	});

	test("first page keeps its neighbour and the last page", (t) => {
		t.expect(paginationItems(0, 12)).toEqual([
			{ gap: false, page: 0 },
			{ gap: false, page: 1 },
			{ gap: true },
			{ gap: false, page: 11 },
		]);
	});
});
