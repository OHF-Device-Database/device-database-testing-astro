import type { DeviceCategoryId, DeviceConnectivityId } from "./device";

export const QUICK_FILTERS = [
	{
		id: "sensors-local",
		filters: { category: ["monitoring", "weather"], connectivity: "offline" },
	},
	{
		id: "lighting-local",
		filters: { category: ["lighting"], connectivity: "offline" },
	},
	{
		id: "energy",
		filters: { category: ["power-and-energy"] },
	},
] as const satisfies {
	id: string;
	filters: {
		category?: DeviceCategoryId[];
		connectivity?: DeviceConnectivityId;
	};
}[];

export type QuickFilter = (typeof QUICK_FILTERS)[number];
export type QuickFilterId = QuickFilter["id"];
