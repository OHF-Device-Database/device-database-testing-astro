import { z } from "astro/zod";

export const exactlyOne = <T extends z.ZodType>(schema: T) =>
	z
		.array(schema)
		.length(1)
		.transform(
			(arr) =>
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- otherwise optional
				arr[0] as z.infer<T>,
		);
