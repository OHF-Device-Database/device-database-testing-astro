import { z } from "astro/zod";

import { Unknown } from "../unknown";
import type { IoDimensionCategory } from "../../io/dimension";
import type { DeviceCategoryId } from "../device";

export const DeviceCategoryTopLevelId = z.enum([
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
export type DeviceCategoryTopLevelId = z.infer<typeof DeviceCategoryTopLevelId>;

export const topLevelCategoryResolver = (
	categories: Record<string, IoDimensionCategory>,
): ((id: DeviceCategoryId | Unknown) => DeviceCategoryTopLevelId | Unknown) => {
	const topOf = new Map<string, DeviceCategoryTopLevelId | Unknown>();

	const walk = (
		nodes: Record<string, IoDimensionCategory>,
		top: DeviceCategoryTopLevelId | Unknown,
	) => {
		for (const [id, node] of Object.entries(nodes)) {
			topOf.set(id, top);
			walk(node.children, top);
		}
	};

	for (const [id, node] of Object.entries(categories)) {
		const parsed = DeviceCategoryTopLevelId.safeParse(id);
		const top = parsed.success ? parsed.data : Unknown;
		topOf.set(id, top);
		walk(node.children, top);
	}

	return (id) => (id === Unknown ? Unknown : (topOf.get(id) ?? Unknown));
};
