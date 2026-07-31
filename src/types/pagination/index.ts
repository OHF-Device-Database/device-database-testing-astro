export type PageItem = { gap: true } | { gap: false; page: number };

export const paginationItems = (current: number, count: number): PageItem[] => {
	const wanted = [
		...new Set(
			[0, count - 1, current - 1, current, current + 1].filter(
				(p) => p >= 0 && p < count,
			),
		),
	].toSorted((a, b) => a - b);

	const items: PageItem[] = [];

	let previous = -1;
	for (const p of wanted) {
		if (p - previous > 1) {
			items.push({ gap: true });
		}
		items.push({ gap: false, page: p });
		previous = p;
	}

	return items;
};
