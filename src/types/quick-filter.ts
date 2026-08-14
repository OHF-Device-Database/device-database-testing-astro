import { z } from "astro/zod";

import type { DeviceCategoryTopLevelId } from "./category";
import type { DeviceConnectivityId } from "./device";

export type QuickFilterCondition = {
	filters: {
		category?: DeviceCategoryTopLevelId[];
		connectivity?: DeviceConnectivityId;
	};
};

export const QUICK_FILTERS = {
	"sensors-local": {
		filters: { category: ["monitoring", "weather"], connectivity: "offline" },
	},
	"lighting-local": {
		filters: { category: ["lighting"], connectivity: "offline" },
	},
	energy: {
		filters: { category: ["power-and-energy"] },
	},
} as const satisfies Record<string, QuickFilterCondition>;

export type QuickFilterId = keyof typeof QUICK_FILTERS;
export const QuickFilterId = z.enum(
	Object.keys(QUICK_FILTERS) as [QuickFilterId, ...QuickFilterId[]],
);
