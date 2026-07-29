import { z } from "astro/zod";

import { ioFetch, searchParameters } from ".";

import { withUnknown } from "../types/unknown";
import { IoDeviceCategoryId } from "./device";
import type { IoDeviceConnectivityId } from "./device";

export type IoGetDimensionsQuery = {
	term?: string;
	manufacturer?: Set<string>;
	"!manufacturer"?: Set<string>;
	connectivity?: Set<IoDeviceConnectivityId>;
	"!connectivity"?: Set<IoDeviceConnectivityId>;
	category?: Set<IoDeviceCategoryId>;
	"!category"?: Set<IoDeviceCategoryId>;
};

const DimensionCategory = z.object({
	name: withUnknown(IoDeviceCategoryId),
	count: z.number(),
	get children() {
		return z.array(DimensionCategory);
	},
});
const GetDimensionsSchema = z.object({
	body: z.object({
		manufacturers: z.object({ name: z.string(), count: z.number() }),
		categories: z.array(DimensionCategory),
		connectivity: z.object({
			offline: z.object({ count: z.number() }),
			online: z.object({ count: z.number() }),
		}),
	}),
	headers: z.unknown(),
});

export const getDimensions = async (query: IoGetDimensionsQuery) => {
	const { body } = await ioFetch(
		"/api/unstable/dimensions",
		GetDimensionsSchema,
		searchParameters(query),
	);

	return body;
};
