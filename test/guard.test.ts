import { z } from "astro/zod";
import { test } from "vitest";

import { guard } from "../src/types/guard";

const Color = z.enum(["red", "green", "blue"]);
const isColor = guard(Color);

const Constant = z.enum({ pi: 3.14, e: 2.71 });
const isConstant = guard(Constant);

test("returns true for a valid enum member", (t) => {
	t.expect(isColor("red")).toBe(true);
	t.expect(isConstant(3.14)).toBe(true);
});

test("returns true for every enum member", (t) => {
	for (const value of Color.options) {
		t.expect(isColor(value)).toBe(true);
	}

	for (const value of Constant.options) {
		t.expect(isConstant(value)).toBe(true);
	}
});

test("returns false for a string not in the enum", (t) => {
	t.expect(isColor("yellow")).toBe(false);
	t.expect(isConstant(0.66)).toBe(false);
});
