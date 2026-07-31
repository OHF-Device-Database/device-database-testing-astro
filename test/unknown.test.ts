import { z } from "astro/zod";
import { test } from "vitest";

import { Unknown, withUnknown } from "../src/types/unknown";

test("decodes to value of provided enum", (t) => {
	t.expect(withUnknown(z.enum(["yes", "no"])).safeParse("yes").data).toBe(
		"yes",
	);
});

test("decodes to unknown", (t) => {
	t.expect(withUnknown(z.enum(["yes", "no"])).safeParse("maybe").data).toBe(
		Unknown,
	);
});
