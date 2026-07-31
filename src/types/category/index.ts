import { DeviceCategoryId } from "../device";
import { Unknown } from "../unknown";
import type { IoDimensionCategory } from "../../io/dimension";

export const topLevelCategoryResolver = (
	categories: Record<string, IoDimensionCategory>,
): ((id: string) => DeviceCategoryId | Unknown) => {
	const topOf = new Map<string, DeviceCategoryId | Unknown>();

	const walk = (
		nodes: Record<string, IoDimensionCategory>,
		top: DeviceCategoryId | Unknown,
	) => {
		for (const [id, node] of Object.entries(nodes)) {
			topOf.set(id, top);
			walk(node.children, top);
		}
	};

	for (const [id, node] of Object.entries(categories)) {
		const parsed = DeviceCategoryId.safeParse(id);
		const top = parsed.success ? parsed.data : Unknown;
		topOf.set(id, top);
		walk(node.children, top);
	}

	return (id) => topOf.get(id) ?? Unknown;
};
