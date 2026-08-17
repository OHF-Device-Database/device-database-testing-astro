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
	"printing",
	"3d-printer",
	"ink-printer",
	"networking",
	"router",
	"smart-home-hub",
	"button-switch-and-control",
	"button",
	"control-panel",
	"remote",
	"switch",
	"cleaning",
	"vacuum",
	"climate-control",
	"air-conditioner",
	"air-purifier",
	"dehumidifier",
	"fan",
	"heater",
	"heat-pump",
	"humidifier",
	"hvac",
	"thermostat",
	"irrigation",
	"kitchen-and-household",
	"refrigerator",
	"scale",
	"sous-vide",
	"lighting",
	"bulb",
	"monitoring",
	"motion-and-presence-sensor",
	"air-quality-sensor",
	"contact-sensor",
	"environment-sensor",
	"device-tracker",
	"pool-and-spa",
	"water-management",
	"water-heater",
	"valve",
	"garden",
	"lawn-mower",
	"weather",
	"pets",
	"pet-feeder",
	"power-and-energy",
	"metering",
	"plug-and-outlet",
	"security-and-access-control",
	"alarm-and-siren",
	"camera",
	"deadbolt",
	"doorbell",
	"door-lock",
	"garage-door",
	"gate-controller",
	"keypad",
	"entertainment",
	"speaker",
	"tv",
	"streaming",
	"vehicle-and-mobility",
	"car",
	"ev-charging",
	"cover",
	"blind",
	"shade",
	"curtain",
	"awning",
]);
export type IoDeviceCategoryId = z.infer<typeof IoDeviceCategoryId>;

export const IoDeviceCategory = z.object({
	id: withUnknown(IoDeviceCategoryId),
	source: z.optional(z.string()),
});
export type IoDeviceCategory = z.infer<typeof IoDeviceCategory>;

export const IoDeviceMono = z
	.object({
		manufacturer: z.string(),
		categories: z.optional(z.array(IoDeviceCategory)),
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
export const getDevices = async (
	query: IoGetDevicesQuery,
	signal?: AbortSignal,
) => {
	const { body, headers } = await ioFetch(
		"/api/unstable/derived/devices",
		GetDevicesSchema,
		searchParameters(query),
		"application/json",
		signal,
	);

	const pages =
		Number(new URL(headers.link.last).searchParams.get("page") ?? 0) + 1;

	return {
		devices: body,
		total: headers["content-range"].total,
		pages,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};

const GetDeviceCountSchema = z.object({
	body: z.any(),
	headers: z.object({
		"content-range": exactlyOne(IoHeaderContentRange("items")),
		...IoHeadersCaching.shape,
	}),
});
export const getDeviceCount = async () => {
	const { headers } = await ioFetch(
		"/api/unstable/derived/devices",
		GetDeviceCountSchema,
		// don't constrain size, as there' a good chance the non-parametric endpoint is already cached upstream
	);

	return {
		total: headers["content-range"].total,
		caching: pick(headers, ["cache-control", "last-modified"]),
	};
};

const IoRef = z.object({ id: z.string(), url: z.string() });

export const IoDeviceDuplicates = z.object({
	items: z.array(IoDevicePoly.and(z.object({ url: z.string() }))),
	total: z.number(),
	next: z.optional(z.string()),
});
export type IoDeviceDuplicates = z.infer<typeof IoDeviceDuplicates>;

export const IoDeviceCanonical = IoDevicePoly.and(
	z.object({
		url: z.string(),
		duplicates: z.array(IoRef),
	}),
);
export type IoDeviceCanonical = z.infer<typeof IoDeviceCanonical>;

const DeviceGetSchema = z.object({
	// deduplication fields stay optional so an older api edition doesn't fail every device page
	body: IoDeviceMono.and(
		z.object({
			duplicates: z.optional(IoDeviceDuplicates),
			canonical: z.optional(IoDeviceCanonical),
		}),
	),
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
