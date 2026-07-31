import { describe, test, vi } from "vitest";

import { Unknown } from "../unknown";
import { topLevelCategoryResolver } from "./index";

vi.mock("astro:env/server", () => ({ API_AUTHORITY: "https://example.com" }));

const TREE = {
	cleaning: {
		name: "Cleaning",
		count: 130,
		children: { vacuum: { name: "Vacuum", count: 130, children: {} } },
	},
	"security-and-access-control": {
		name: "Security and access control",
		count: 735,
		children: {
			camera: {
				name: "Camera",
				count: 610,
				children: { doorbell: { name: "Doorbell", count: 12, children: {} } },
			},
		},
	},
	lighting: { name: "Lighting", count: 1438, children: {} },
};

describe("topLevelCategoryResolver", () => {
	test("maps ids at any depth to the top-level ancestor", (t) => {
		const resolve = topLevelCategoryResolver(TREE);
		t.expect(resolve("vacuum")).toBe("cleaning");
		t.expect(resolve("doorbell")).toBe("security-and-access-control");
		t.expect(resolve("lighting")).toBe("lighting");
	});

	test("resolves ids outside the tree to Unknown", (t) => {
		const resolve = topLevelCategoryResolver(TREE);
		t.expect(resolve("does-not-exist")).toBe(Unknown);
	});
});
