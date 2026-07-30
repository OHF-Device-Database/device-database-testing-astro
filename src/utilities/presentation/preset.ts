const PresentationRenderPresetSymbol = Symbol("PresentationRenderPreset");
export type PresentationRenderPreset = {
	[PresentationRenderPresetSymbol]: {
		size: number;
		strokeWidth: number;
		cls?: string;
	};
};

export const peek = <T extends PresentationRenderPreset>(peekable: T) =>
	peekable[PresentationRenderPresetSymbol];

type FlattenType<T> = { [K in keyof T]: T[K] } & {};

type _PresentationRenderPresetRoleIconInner = {
	size: number;
	strokeWidth: number;
	cls: "icon";
};
export class PresentationRenderPresetRoleIcon<T> {
	static [PresentationRenderPresetSymbol] = {
		size: 20,
		strokeWidth: 2,
		cls: "icon",
	} as const satisfies _PresentationRenderPresetRoleIconInner;

	public readonly [PresentationRenderPresetSymbol]: T;

	private constructor(modified: T) {
		this[PresentationRenderPresetSymbol] = modified;
	}

	static withSize<S extends number>(size: S) {
		return new PresentationRenderPresetRoleIcon({
			...PresentationRenderPresetRoleIcon[PresentationRenderPresetSymbol],
			size,
		});
	}
	static withStrokeWidth<S extends number>(strokeWidth: S) {
		return new PresentationRenderPresetRoleIcon({
			...PresentationRenderPresetRoleIcon[PresentationRenderPresetSymbol],
			strokeWidth,
		});
	}

	private with<
		const K extends keyof _PresentationRenderPresetRoleIconInner,
		V extends _PresentationRenderPresetRoleIconInner[K],
	>(
		key: K,
		value: V,
	): PresentationRenderPresetRoleIcon<FlattenType<Omit<T, K> & Record<K, V>>> {
		return new PresentationRenderPresetRoleIcon({
			...this[PresentationRenderPresetSymbol],
			[key]: value,
		} as never);
	}

	withSize<S extends number>(size: S) {
		return this.with("size", size);
	}
	withStrokeWidth<S extends number>(strokeWidth: S) {
		return this.with("strokeWidth", strokeWidth);
	}
}

type _PresentationRenderPresetRoleGlyphInner = {
	size: number;
	strokeWidth: number;
};
export class PresentationRenderPresetRoleGlyph<T> {
	static [PresentationRenderPresetSymbol] = {
		size: 40,
		strokeWidth: 1.5,
	} as const satisfies _PresentationRenderPresetRoleGlyphInner;

	public readonly [PresentationRenderPresetSymbol]: T;

	private constructor(modified: T) {
		this[PresentationRenderPresetSymbol] = modified;
	}

	static withSize<S extends number>(size: S) {
		return new PresentationRenderPresetRoleGlyph({
			...PresentationRenderPresetRoleGlyph[PresentationRenderPresetSymbol],
			size,
		});
	}
	static withStrokeWidth<S extends number>(strokeWidth: S) {
		return new PresentationRenderPresetRoleGlyph({
			...PresentationRenderPresetRoleGlyph[PresentationRenderPresetSymbol],
			strokeWidth,
		});
	}

	private with<
		const K extends keyof _PresentationRenderPresetRoleGlyphInner,
		V extends _PresentationRenderPresetRoleGlyphInner[K],
	>(
		key: K,
		value: V,
	): PresentationRenderPresetRoleGlyph<FlattenType<Omit<T, K> & Record<K, V>>> {
		return new PresentationRenderPresetRoleGlyph({
			...this[PresentationRenderPresetSymbol],
			[key]: value,
		} as never);
	}

	withSize<S extends number>(size: S) {
		return this.with("size", size);
	}
	withStrokeWidth<S extends number>(strokeWidth: S) {
		return this.with("strokeWidth", strokeWidth);
	}
}
