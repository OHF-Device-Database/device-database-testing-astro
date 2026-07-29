/** biome-ignore-all lint/style/useNamingConvention: api is snake_cased */
import { z } from "astro/zod";

import {
	ioFetch,
	IoHeaderContentRange,
	IoHeaderLink,
	IoHeadersCaching,
	searchParameters,
} from ".";

import { exactlyOne } from "../types/exactly-one";
import { withUnknown } from "../types/unknown";
import { pick } from "../utilities/pick";

export const IoDeviceConnectivityId = z.enum(["online", "offline"]);
export type IoDeviceConnectivityId = z.infer<typeof IoDeviceConnectivityId>;

export const IoDeviceVersionSoftware = z.object({
	version: z.string(),
	active: z.number(),
	first_encountered: z.coerce.date(),
});

export const IoDeviceVersionHardware = z.object({
	version: z.string(),
});

export const IoDeviceIntegration = z.object({
	name: z.string().catch("unknown"),
	domain: z.string(),
});

export const IoDeviceEntity = z.object({
	domain: z.string(),
	original_device_class: z.optional(z.string()),
});

export const IoDeviceCategoryId = z.enum([
	"button-switch-and-control",
	"cleaning",
	"climate-control",
	"cover",
	"entertainment",
	"garden",
	"irrigation",
	"kitchen-and-household",
	"lighting",
	"monitoring",
	"networking",
	"pets",
	"pool-and-spa",
	"power-and-energy",
	"printing",
	"security-and-access-control",
	"vehicle-and-mobility",
	"water-management",
	"weather",
]);
export type IoDeviceCategoryId = z.infer<typeof IoDeviceCategoryId>;

export const IoDeviceMono = z
	.object({
		manufacturer: z.string(),
		categories: z.optional(z.array(withUnknown(IoDeviceCategoryId))),
		connectivity: withUnknown(IoDeviceConnectivityId),
		count: z.number(),
		integration: IoDeviceIntegration,
		entities: z.array(IoDeviceEntity),
		versions: z.object({
			software: z.array(IoDeviceVersionSoftware),
			hardware: z.array(IoDeviceVersionHardware),
		}),
		first_encountered: z.coerce.date(),
	})
	.and(
		z.union([
			z.object({ model: z.string(), model_id: z.string() }),
			z.object({ model: z.string().optional(), model_id: z.string() }),
			z.object({ model: z.string(), model_id: z.string().optional() }),
		]),
	);
export type IoDeviceMono = z.infer<typeof IoDeviceMono>;

export const IoDevicePoly = IoDeviceMono.and(
	z.object({
		id: z.string(),
	}),
);
export type IoDevicePoly = z.infer<typeof IoDevicePoly>;

export type IoGetDevicesQuery = {
	page?: number;
	size?: number;
	term?: string;
	manufacturer?: Set<string>;
	"!manufacturer"?: Set<string>;
	connectivity?: Set<IoDeviceConnectivityId>;
	"!connectivity"?: Set<IoDeviceConnectivityId>;
	category?: Set<IoDeviceCategoryId>;
	"!category"?: Set<IoDeviceCategoryId>;
};

const GetDevicesSchema = z.object({
	body: z.array(IoDevicePoly),
	headers: z.object({
		link: exactlyOne(IoHeaderLink),
		"content-range": exactlyOne(IoHeaderContentRange("items")),
		...IoHeadersCaching.shape,
	}),
});
export const getDevices = async (query: IoGetDevicesQuery) => {
	const { body, headers } = await ioFetch(
		"/api/unstable/derived/devices",
		GetDevicesSchema,
		searchParameters(query),
	);

	return {
		devices: body,
		total: headers["content-range"].total,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};

export const getDeviceCount = async () => {
	const { headers } = await ioFetch(
		"/api/unstable/derived/devices",
		GetDevicesSchema,
		// don't constrain size, as there' a good chance the non-parametric endpoint is already cached upstream
	);

	return {
		total: headers["content-range"].total,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};

const DeviceGetSchema = z.object({
	body: IoDeviceMono,
	headers: z.object({
		...IoHeadersCaching.shape,
	}),
});
export const getDevice = async (id: string) => {
	const { body, headers } = await ioFetch(
		`/api/unstable/derived/devices/${encodeURIComponent(id)}`,
		DeviceGetSchema,
	);

	return {
		device: body,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};
