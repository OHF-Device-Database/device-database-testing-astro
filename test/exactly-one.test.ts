import { z } from "astro/zod";
import { test } from "vitest";

import { exactlyOne } from "../src/types/exactly-one";

const schema = exactlyOne(z.number());

test("parses single-element array and returns the element", (t) => {
	t.expect(schema.parse([42])).toBe(42);
});

test("rejects empty array", (t) => {
	t.expect(schema.safeParse([]).success).toBe(false);
});

test("rejects array with more than one element", (t) => {
	t.expect(schema.safeParse([1, 2]).success).toBe(false);
});

test("validates inner element against provided schema", (t) => {
	t.expect(schema.safeParse(["not a number"]).success).toBe(false);
});
