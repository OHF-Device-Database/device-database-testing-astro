import type { ZodEnum } from "astro/zod";

/** can only support enums because zod offers no sound way to validate generic types */
export const guard =
	<T extends string | number>(
		type: ZodEnum<Record<string, T>>,
	): ((data: unknown) => data is T) =>
	(data: unknown): data is T =>
		(type.options as readonly unknown[]).includes(data);
