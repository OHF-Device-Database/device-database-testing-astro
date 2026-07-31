import { z } from "astro/zod";

import { ioFetch, IoHeadersCaching, searchParameters } from ".";

import { pick } from "../utilities/pick";
import type { IoDeviceCategoryId, IoDeviceConnectivityId } from "./device";

export type IoGetDimensionsQuery = {
	term?: string;
	manufacturer?: Set<string>;
	"!manufacturer"?: Set<string>;
	connectivity?: Set<IoDeviceConnectivityId>;
	"!connectivity"?: Set<IoDeviceConnectivityId>;
	category?: Set<IoDeviceCategoryId>;
	"!category"?: Set<IoDeviceCategoryId>;
};

export type IoDimensionCategory = {
	name: string;
	count: number;
	children: Record<string, IoDimensionCategory>;
};
const IoDimensionCategory: z.ZodType<IoDimensionCategory> = z.lazy(() =>
	z.object({
		name: z.string(),
		count: z.number(),
		children: z.record(z.string(), IoDimensionCategory),
	}),
);

const GetDimensionsSchema = z.object({
	body: z.object({
		manufacturers: z.array(z.object({ name: z.string(), count: z.number() })),
		categories: z.record(z.string(), IoDimensionCategory),
		connectivity: z.object({
			offline: z.optional(z.object({ count: z.number() })),
			online: z.optional(z.object({ count: z.number() })),
		}),
	}),
	headers: z.object({
		...IoHeadersCaching.shape,
	}),
});

export const getDimensions = async (query: IoGetDimensionsQuery = {}) => {
	const { body, headers } = await ioFetch(
		"/api/unstable/dimensions",
		GetDimensionsSchema,
		searchParameters(query),
	);

	return {
		dimensions: body,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};
