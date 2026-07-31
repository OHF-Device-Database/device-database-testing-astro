import { z } from "astro/zod";

export const exactlyOne = <T extends z.ZodType>(schema: T) =>
	z
		.array(schema)
		.length(1)
		.transform((arr) => arr[0] as z.infer<T>);
