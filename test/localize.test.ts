import { describe, test } from "vitest";

import { localize } from "../src/utilities/localize";

describe("localize", () => {
	test("resolves dot-notation keys", (t) => {
		t.expect(localize("home.title")).toBe(
			"Find the right device for your smart home",
		);
	});

	test("formats icu arguments", (t) => {
		t.expect(localize("home.browse_all", { count: 19707 })).toBe(
			"Browse all 19,707 devices →",
		);
	});
});
