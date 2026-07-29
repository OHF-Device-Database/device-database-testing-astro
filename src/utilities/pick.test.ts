import { test } from "vitest";

import { pick } from "./pick";

const obj = { name: "Alice", age: 30, email: "alice@example.com" };

test("picks specified keys from an object", (t) => {
	t.expect(pick(obj, ["name", "email"])).toEqual({
		name: "Alice",
		email: "alice@example.com",
	});
});

test("picks a single key", (t) => {
	t.expect(pick(obj, ["age"])).toEqual({ age: 30 });
});

test("returns empty object when keys array is empty", (t) => {
	t.expect(pick(obj, [])).toEqual({});
});

test("picks all keys when all are specified", (t) => {
	t.expect(pick(obj, ["name", "age", "email"])).toEqual(obj);
});

test("ignores keys not present on the object", (t) => {
	const sparse = { a: 1 } as { a: number; b?: number };
	t.expect(pick(sparse, ["a", "b"])).toEqual({ a: 1 });
});
