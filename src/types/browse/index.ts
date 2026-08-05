import { DeviceCategoryTopLevelId } from "../category";
import type { IoGetDevicesQuery } from "../../io/device";

export type BrowseFilterChip = { label: string; href: string };

export type BrowseFilters = {
	term?: string | undefined;
	category: Set<DeviceCategoryTopLevelId>;
	manufacturer: Set<string>;
	localOnly: boolean;
};

export const browseFiltersFromSearchParams = (
	params: URLSearchParams,
): BrowseFilters => {
	const term = params.get("q")?.trim();

	return {
		term: typeof term === "string" && term.length > 0 ? term : undefined,
		category: new Set(
			params
				.getAll("category")
				.flatMap((id) =>
					DeviceCategoryTopLevelId.safeParse(id).success
						? [id as DeviceCategoryTopLevelId]
						: [],
				),
		),
		manufacturer: new Set(
			params.getAll("manufacturer").filter((name) => name.length > 0),
		),
		localOnly: params.get("local") === "1",
	};
};

export const browseFiltersToSearchParams = (
	filters: BrowseFilters,
): URLSearchParams => {
	const params = new URLSearchParams();
	if (typeof filters.term !== "undefined") {
		params.set("q", filters.term);
	}
	for (const id of [...filters.category].toSorted()) {
		params.append("category", id);
	}
	for (const name of [...filters.manufacturer].toSorted()) {
		params.append("manufacturer", name);
	}
	if (filters.localOnly) {
		params.set("local", "1");
	}

	return params;
};

export const browseFiltersToHref = (filters: BrowseFilters): string => {
	const qs = browseFiltersToSearchParams(filters).toString();

	return `/browse${qs.length > 0 ? `?${qs}` : ""}`;
};

export const browseFiltersToQuery = (
	filters: BrowseFilters,
): IoGetDevicesQuery => ({
	...(typeof filters.term !== "undefined" ? { term: filters.term } : {}),
	...(filters.category.size > 0 ? { category: filters.category } : {}),
	...(filters.manufacturer.size > 0
		? { manufacturer: filters.manufacturer }
		: {}),
	...(filters.localOnly
		? { "!connectivity": new Set(["online"] as const) }
		: {}),
});

export const browseFiltersCount = (filters: BrowseFilters): number =>
	filters.category.size +
	filters.manufacturer.size +
	(filters.localOnly ? 1 : 0);

const withToggled = <T>(set: Set<T>, value: T): Set<T> => {
	const next = new Set(set);
	if (next.has(value)) {
		next.delete(value);
	} else {
		next.add(value);
	}

	return next;
};

export const withCategoryToggled = (
	filters: BrowseFilters,
	id: DeviceCategoryTopLevelId,
): BrowseFilters => ({
	...filters,
	category: withToggled(filters.category, id),
});

export const withManufacturerToggled = (
	filters: BrowseFilters,
	name: string,
): BrowseFilters => ({
	...filters,
	manufacturer: withToggled(filters.manufacturer, name),
});

export const withLocalOnly = (
	filters: BrowseFilters,
	localOnly: boolean,
): BrowseFilters => ({ ...filters, localOnly });

export const withoutTerm = (filters: BrowseFilters): BrowseFilters => ({
	...filters,
	term: undefined,
});

export const cleared = (filters: BrowseFilters): BrowseFilters => ({
	...(typeof filters.term !== "undefined" ? { term: filters.term } : {}),
	category: new Set(),
	manufacturer: new Set(),
	localOnly: false,
});
