import { navigate } from "astro:transitions/client";
import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { getDevices } from "../io/device.js";
import { m } from "../paraglide/messages.js";
import { browseFiltersToSearchParams } from "../types/browse/index.js";
import { DeviceCategoryTopLevelId } from "../types/category/index.js";
import { devicePolyMap } from "../types/device/index.js";
import { guard } from "../types/guard.js";
import { QUICK_FILTERS, QuickFilterId } from "../types/quick-filter.js";
import { defineElementOnce } from "../utilities/define-element.js";
import {
	device,
	quickFilter,
	render,
} from "../utilities/presentation/index.js";
import { PresentationRenderPresetRoleIcon } from "../utilities/presentation/preset.js";
import type { DevicePoly } from "../types/device/index.js";

import "../styles/searchbox.css";

import { createRef, ref } from "lit/directives/ref.js";
import type { Ref } from "lit/directives/ref.js";

type SectionCategory = {
	kind: "category";
	items: { id: DeviceCategoryTopLevelId; count?: number | undefined }[];
};
type SectionDevice = {
	kind: "device";
	items?: DevicePoly[] | undefined;
	more?: boolean | undefined;
};
type SectionManufacturer = {
	kind: "manufacturer";
	items?:
		| {
				name: string;
				count: number;
		  }[]
		| undefined;
};
type SectionQuickFilter = {
	kind: "quick-filter";
	items: QuickFilterId[];
};
type Section =
	SectionCategory | SectionDevice | SectionManufacturer | SectionQuickFilter;

export class DeviceSearch extends LitElement {
	@property() size: "header" | "hero" = "header";
	@property() placeholder = "Search";

	@state() private _term = "";

	@state() private _fetchedDevices: {
		devices: DevicePoly[];
		total: number;
	} | null = null;
	@state() private _fetchedDimensions: {
		manufacturers: { name: string; count: number }[];
		categories: Record<DeviceCategoryTopLevelId, number>;
	} | null = null;

	private _fetchDevicesTimer?: ReturnType<typeof setTimeout>;
	private _fetchDevicesAbort?: AbortController;

	// server-rendered elements that are enhanced
	private _input: HTMLInputElement | null = null;
	private _clearButton: HTMLButtonElement | null = null;
	private _popover: Ref<HTMLInputElement> = createRef();

	// opt-out of shadow dom to be able to reference global css classes
	protected override createRenderRoot(): HTMLElement {
		return this;
	}

	override connectedCallback(): void {
		super.connectedCallback();

		const form = this.querySelector<HTMLFormElement>(".searchbox-input");
		this._input = form?.querySelector<HTMLInputElement>("input") ?? null;

		const clearButton = this.querySelector<HTMLButtonElement>(
			".searchbox-button-clear",
		);
		if (clearButton !== null) {
			this._clearButton = clearButton;
			this._clearButton.hidden = false;
		}

		this._term = this._input?.value ?? "";
		this._input?.addEventListener("input", this._onInput);
		this._input?.addEventListener("focus", this._onFocus);
		this._input?.addEventListener("blur", this._onBlur);
		this._input?.addEventListener("keydown", this._onKeyDown);
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._input?.removeEventListener("input", this._onInput);
		this._input?.removeEventListener("focus", this._onFocus);
		this._input?.removeEventListener("blur", this._onBlur);
		this._input?.removeEventListener("keydown", this._onKeyDown);
		this._resetFetchedDevices();
	}

	private get _isEmpty(): boolean {
		return this._term.trim().length === 0;
	}

	private _urlFilter(id: QuickFilterId): string {
		const { filters } = QUICK_FILTERS[id];
		const params = browseFiltersToSearchParams({
			category: new Set(filters.category),
			categoryMode: "include",
			localOnly:
				"connectivity" in filters && filters.connectivity === "offline",
			manufacturer: new Set(),
			manufacturerMode: "include",
		});

		const qs = params.toString();
		return `/browse${qs ? "?" + qs : ""}`;
	}

	private _onInput = (event: InputEvent) => {
		this._term = (event.target as HTMLInputElement).value;
		this._scheduleFetchDevices();
	};

	private _onFocus = (event: FocusEvent) => {
		this._popover?.value?.showPopover(
			event.target !== null
				? { source: event.target as HTMLElement }
				: undefined,
		);
	};

	private _onBlur = () => {
		this._popover?.value?.hidePopover();
		for (const button of this._popover?.value?.getElementsByTagName("button") ??
			[]) {
			button.setAttribute("aria-selected", "false");
			this._input?.removeAttribute("aria-activedescendant");
		}
	};

	private _onKeyDown = (event: KeyboardEvent) => {
		const popover = this._popover.value;
		if (typeof popover === "undefined") {
			return;
		}

		const rows = [...popover.getElementsByTagName("button")];
		if (typeof rows === "undefined") {
			return;
		}

		const active = popover.querySelector<HTMLButtonElement>(
			'[aria-selected="true"]',
		);
		const activeIdx = active !== null ? rows.indexOf(active) : null;

		switch (event.key) {
			case "Tab":
			case "ArrowDown": {
				active?.removeAttribute("aria-selected");

				const next =
					rows[
						activeIdx !== null ? Math.min(activeIdx + 1, rows.length - 1) : 0
					];

				// allow escaping focus of popover when navigating past last row
				if (event.key === "Tab" && next !== active) {
					event.preventDefault();
				}

				if (typeof next !== "undefined") {
					next.ariaSelected = "true";
					this._input?.setAttribute("aria-activedescendant", next.id);
				}

				break;
			}
			case "ArrowUp": {
				active?.removeAttribute("aria-selected");

				const next =
					rows[
						activeIdx !== null ? Math.max(activeIdx - 1, 0) : rows.length - 1
					];
				if (typeof next !== "undefined") {
					next.ariaSelected = "true";
					this._input?.setAttribute("aria-activedescendant", next.id);
				}

				break;
			}
			case "Enter": {
				event.preventDefault();
				active?.click();
				break;
			}
			case "Escape": {
				popover.hidePopover();
				break;
			}
		}
	};

	private _scheduleFetchDevices(): void {
		clearTimeout(this._fetchDevicesTimer);
		if (this._isEmpty) {
			this._fetchDevicesAbort?.abort();
			return;
		}
		this._fetchDevicesTimer = setTimeout(() => void this._fetchDevices(), 220);
	}

	private async _fetchDevices(): Promise<void> {
		const term = this._term;
		this._fetchDevicesAbort?.abort();
		const controller = new AbortController();
		this._fetchDevicesAbort = controller;

		const result = await getDevices({ term });
		this._fetchedDevices = {
			devices: result.devices.map(devicePolyMap),
			total: result.total,
		};
	}

	private _resetFetchedDevices(): void {
		clearTimeout(this._fetchDevicesTimer);
		this._fetchDevicesAbort?.abort();
		this._fetchedDevices = null;
	}

	private static _sectionQuickFilter(term: string): SectionQuickFilter {
		const is = guard(QuickFilterId);

		return {
			kind: "quick-filter",
			items: Object.keys(QUICK_FILTERS).flatMap((key) => {
				if (!is(key)) {
					return [];
				}
				const { label } = quickFilter(key);
				if (!label.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
					return [];
				}
				return [key];
			}),
		};
	}

	/** uses fetched top-level categories with count information when available, otherwise falls back to
	 * known sorted alphabetically on identifier, so that order remains stable once fetched results become available */
	private _sectionCategory(term: string): SectionCategory {
		const sorter = (a: { id: string }, b: { id: string }) =>
			a.id.localeCompare(b.id);

		if (this._fetchedDimensions !== null) {
			return {
				kind: "category",
				items: Object.entries(this._fetchedDimensions.categories)
					.flatMap(([id, count]) => {
						const parsed = DeviceCategoryTopLevelId.safeParse(id);
						if (!parsed.success) {
							return [];
						}

						return [{ id: parsed.data, count }];
					})
					.toSorted(sorter),
			};
		}

		return {
			kind: "category",
			items: DeviceCategoryTopLevelId.options
				.flatMap((id) => {
					const { label } = device.category(id);
					if (!label.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
						return [];
					}

					return [{ id }];
				})
				.toSorted(sorter),
		};
	}

	private _sectionDevice(): SectionDevice {
		return {
			kind: "device",
			items: this._fetchedDevices?.devices,
			more:
				this._fetchedDevices !== null
					? this._fetchedDevices.total > this._fetchedDevices.devices.length
					: undefined,
		};
	}

	private _sectionManufacturer(): SectionManufacturer {
		return {
			kind: "manufacturer",
			items: this._fetchedDimensions?.manufacturers,
		};
	}

	private get _sections() {
		if (this._isEmpty) {
			return [DeviceSearch._sectionQuickFilter("")] as const;
		}

		return [
			DeviceSearch._sectionQuickFilter(this._term),
			this._sectionCategory(this._term),
			this._sectionDevice(),
			this._sectionManufacturer(),
		] as const;
	}

	private _renderSection(section: Section) {
		switch (section.kind) {
			case "quick-filter":
				return html`<span class="label"
						>${m.search_popover_section_quickfilter()}</span
					>
					<div class="searchbox-popover-section-rows">
						${section.items.map((f) => {
							const filter = quickFilter(f);
							return html`<button
								id=${`quick-filter-${f}`}
								@click=${() => void navigate(this._urlFilter(f))}
							>
								<span>
									${unsafeHTML(render(filter, PresentationRenderPresetRoleIcon.withSize(11)))}
								</span>
								${DeviceSearch._highlight(filter.label, this._term)}
							</button>`;
						})}
					</div>`;
			case "category":
			case "manufacturer":
			case "device":
				return nothing;
		}
	}

	private static _highlight(text: string, term: string) {
		if (!term) {
			return text;
		}
		const i = text.toLowerCase().indexOf(term.toLowerCase());
		if (i < 0) {
			return text;
		}
		return html`${text.slice(0, i)}<mark>${text.slice(i, i + term.length)}</mark>${text.slice(
			i + term.length,
		)}`;
	}

	protected override render() {
		return html`<slot></slot>
			<div
				class="searchbox-popover"
				popover="manual"
				role="listbox"
				${ref(this._popover)}
			>
				${this._sections.map((s) => html`<div class="searchbox-popover-section">${this._renderSection(s)}</div>`)}
			</div>`;
	}
}

defineElementOnce("device-search", DeviceSearch);

declare global {
	interface HTMLElementTagNameMap {
		"device-search": DeviceSearch;
	}
}
