import { z } from "astro/zod";

import { ioFetch, IoHeadersCaching, searchParameters } from ".";

import { pick } from "../utilities/pick";
import { withUpstreamTtl } from "./memo";
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

const fetchDimensions = async (
	parameters: URLSearchParams,
	signal?: AbortSignal,
) => {
	const { body, headers } = await ioFetch(
		"/api/unstable/dimensions",
		GetDimensionsSchema,
		parameters,
		"application/json",
		signal,
	);

	return {
		dimensions: body,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};

export const getDimensions = async (
	query: IoGetDimensionsQuery = {},
	signal?: AbortSignal,
) => {
	const parameters = searchParameters(query);

	// the unfiltered call is shared across concurrent callers, so it must not
	// be tied to any single caller's abort signal
	if ([...parameters.keys()].length === 0) {
		return withUpstreamTtl("dimensions", () => fetchDimensions(parameters));
	}

	return fetchDimensions(parameters, signal);
};
