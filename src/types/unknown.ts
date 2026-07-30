import { z } from "astro/zod";

/** fallback value for codecs that decode api types */
export const Unknown = Symbol("Unknown");
export type Unknown = typeof Unknown;

// astro's included zod does not support symbol literals
const _Unknown = z.custom<Unknown>((v: unknown) => v === Unknown);

// explicit return type prevents typescript from widening the `Unknown` unique symbol
// to `symbol` when the schema is used inside `z.object().and()` intersections
export const withUnknown = <
	E extends Readonly<Record<string, string | number>>,
>(
	codec: z.ZodEnum<E>,
): z.ZodType<z.infer<z.ZodEnum<E>> | Unknown> =>
	z.union([codec, _Unknown]).catch(Unknown);
