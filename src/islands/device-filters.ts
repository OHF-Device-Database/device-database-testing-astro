import {
  navigate,
  type TransitionBeforePreparationEvent,
  type TransitionBeforeSwapEvent,
} from "astro:transitions/client"
import { LitElement, html, nothing } from "lit"
import { property, state } from "lit/decorators.js"
import { unsafeHTML } from "lit/directives/unsafe-html.js"
import {
  type BrowseFilters,
  FACET_SIDEBAR_LIMIT,
  type FacetDimension,
  type FilterMode,
  type FilterOption,
  type ManufacturerFacet,
  browseFiltersHref,
  categoryOptions,
  groupByLetter,
  parseBrowseFilters,
} from "../lib/browse-filters.js"
import { defineElementOnce } from "../lib/define-element.js"
import { icon } from "../lib/icons.js"

interface DimensionConfig {
  dim: FacetDimension
  label: string
  options: FilterOption[]
  letterGroups: boolean
}

function sameSelection(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id))
}

export class DeviceFilters extends LitElement {
  @property({ type: Array }) manufacturers: ManufacturerFacet[] = []
  @property({ type: Object }) categoryCounts: Record<string, number> = {}

  @state() private _moreDim: FacetDimension | null = null
  @state() private _moreQuery = ""
  // The dialog edits a draft and commits once on close (backdrop, X, or View results),
  // so the page never re-renders under the open dialog. Sidebar rows commit live.
  @state() private _draftSelected = new Set<string>()
  @state() private _draftMode: FilterMode = "include"

  private _onChange = () => this.requestUpdate()

  protected createRenderRoot(): HTMLElement {
    return this
  }

  connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener("browse:filter-change", this._onChange)
    window.addEventListener("popstate", this._onChange)
    document.addEventListener("astro:page-load", this._onChange)
    window.addEventListener("browse:open-filter", this._onOpenFilter as EventListener)
    document.addEventListener("astro:before-preparation", this._onTransition)
    document.addEventListener("astro:before-swap", this._onTransition)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener("browse:filter-change", this._onChange)
    window.removeEventListener("popstate", this._onChange)
    document.removeEventListener("astro:page-load", this._onChange)
    window.removeEventListener("browse:open-filter", this._onOpenFilter as EventListener)
    document.removeEventListener("astro:before-preparation", this._onTransition)
    document.removeEventListener("astro:before-swap", this._onTransition)
  }

  private _onOpenFilter = (e: CustomEvent<{ dim: FacetDimension }>) => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      this._openMore(e.detail.dim)
    }
  }

  // Target URL of an in-flight page transition, so selections made while a commit
  // is still swapping combine with it instead of resetting to the old URL.
  private _transitioningTo: URL | null = null

  private _onTransition = (
    e: TransitionBeforePreparationEvent | TransitionBeforeSwapEvent,
  ): void => {
    this._transitioningTo = e.to
  }

  private get _filters(): BrowseFilters {
    return parseBrowseFilters(
      // use target url of pending transition if available
      // this way selections that happen during the transition are combined
      this._transitioningTo?.searchParams ??
      new URLSearchParams(window.location.search)
    )
  }

  private get _dimensions(): DimensionConfig[] {
    return [
      {
        dim: "category",
        label: "Category",
        options: categoryOptions().map((c) => ({ ...c, count: this.categoryCounts[c.id] ?? 0 })),
        letterGroups: false,
      },
      {
        dim: "manufacturer",
        label: "Manufacturer",
        options: this.manufacturers.map(({ name, count }) => ({ id: name, label: name, count })),
        letterGroups: true,
      },
    ]
  }

  private _commit(filters: BrowseFilters): void {
    navigate(browseFiltersHref(filters))
  }

  private _setLocal(on: boolean): void {
    this._commit({ ...this._filters, localOnly: on })
  }

  private _setMode(dim: FacetDimension, mode: FilterMode): void {
    const filters = this._filters
    this._commit(
      dim === "category"
        ? { ...filters, categoryMode: mode }
        : { ...filters, manufacturerMode: mode },
    )
  }

  private _toggle(dim: FacetDimension, id: string): void {
    const filters = this._filters
    const set = new Set(filters[dim])
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    this._commit({ ...filters, [dim]: set })
  }

  private _openMore(dim: FacetDimension): void {
    const filters = this._filters
    this._moreDim = dim
    this._moreQuery = ""
    this._draftSelected = new Set(filters[dim])
    this._draftMode = this._modeOf(filters, dim)
    document.body.classList.add("modal-open")
  }

  private _closeMore(): void {
    const dim = this._moreDim
    this._moreDim = null
    document.body.classList.remove("modal-open")
    if (!dim) {
      return
    }
    const filters = this._filters
    if (
      sameSelection(filters[dim], this._draftSelected) &&
      this._modeOf(filters, dim) === this._draftMode
    ) {
      return
    }
    this._commit(
      dim === "category"
        ? { ...filters, category: this._draftSelected, categoryMode: this._draftMode }
        : { ...filters, manufacturer: this._draftSelected, manufacturerMode: this._draftMode },
    )
  }

  private _draftToggle(id: string): void {
    const next = new Set(this._draftSelected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    this._draftSelected = next
  }

  private _modeOf(filters: BrowseFilters, dim: FacetDimension): FilterMode {
    return dim === "category" ? filters.categoryMode : filters.manufacturerMode
  }

  private _renderModeToggle(mode: FilterMode, onSet: (mode: FilterMode) => void) {
    return html`
      <div class="filter-mode" role="group" aria-label="Filter mode">
        <button
          type="button"
          class=${"filter-mode-btn" + (mode === "include" ? " is-active" : "")}
          aria-pressed=${mode === "include"}
          @click=${() => onSet("include")}
        >
          <span>is</span>
        </button>
        <button
          type="button"
          class=${"filter-mode-btn" + (mode === "exclude" ? " is-active" : "")}
          aria-pressed=${mode === "exclude"}
          @click=${() => onSet("exclude")}
        >
          <span>is not</span>
        </button>
      </div>
    `
  }

  private _renderRow(option: FilterOption, selected: Set<string>, onToggle: () => void) {
    return html`
      <label class="filter-row">
        <input type="checkbox" .checked=${selected.has(option.id)} @change=${onToggle} />
        <span class="filter-row-text">${option.label}</span>
        ${option.count !== undefined
          ? html`<span class="count">${option.count.toLocaleString()}</span>`
          : nothing}
      </label>
    `
  }

  private _visibleOptions(config: DimensionConfig, selected: Set<string>): FilterOption[] {
    const visible = config.options.slice(0, FACET_SIDEBAR_LIMIT)
    const shown = new Set(visible.map((o) => o.id))
    for (const option of config.options) {
      if (selected.has(option.id) && !shown.has(option.id)) {
        visible.push(option)
        shown.add(option.id)
      }
    }
    return visible
  }

  private _renderGroup(config: DimensionConfig, filters: BrowseFilters) {
    const selected = filters[config.dim]
    const visible = this._visibleOptions(config, selected)
    const hasMore = config.options.length > visible.length
    return html`
      <div class="filter-group">
        <div class="filter-group-head">
          <div class="filter-group-label">${config.label}</div>
          ${this._renderModeToggle(this._modeOf(filters, config.dim), (mode) =>
            this._setMode(config.dim, mode),
          )}
        </div>
        <div class="filter-options">
          ${visible.map((option) =>
            this._renderRow(option, selected, () => this._toggle(config.dim, option.id)),
          )}
          ${hasMore
            ? html`<button
                type="button"
                class="filter-more"
                @click=${() => this._openMore(config.dim)}
              >
                ${unsafeHTML(icon("search", 16))}<span>More</span>
              </button>`
            : nothing}
        </div>
      </div>
    `
  }

  private _renderMore() {
    const config = this._dimensions.find((d) => d.dim === this._moreDim)
    if (!config) {
      return nothing
    }
    const selected = this._draftSelected
    const term = this._moreQuery.trim().toLowerCase()
    const matched = term
      ? config.options.filter((o) => o.label.toLowerCase().includes(term))
      : config.options
    const groups = config.letterGroups ? groupByLetter(matched) : [["", matched] as const]

    return html`
      <div class="modal-backdrop" role="presentation" @click=${this._closeMore}>
        <div
          class="modal-dialog modal-tall"
          role="dialog"
          aria-modal="true"
          aria-label=${config.label}
          @click=${(e: Event) => e.stopPropagation()}
        >
          <header class="modal-head">
            <div class="modal-head-row">
              <button class="modal-close" aria-label="Close" @click=${this._closeMore}>
                ${unsafeHTML(icon("x", 18))}
              </button>
              <h2>${config.label}</h2>
              ${this._renderModeToggle(this._draftMode, (mode) => (this._draftMode = mode))}
            </div>
            <div class="modal-head-search">
              <div class="modal-search-input">
                ${unsafeHTML(icon("search", 18))}
                <input
                  type="search"
                  .value=${this._moreQuery}
                  placeholder=${`Search ${config.label.toLowerCase()}`}
                  aria-label=${`Search ${config.label.toLowerCase()}`}
                  @input=${(e: Event) => (this._moreQuery = (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          </header>
          <div class="modal-body">
            ${matched.length === 0
              ? html`<div class="modal-empty">No matches for “${this._moreQuery}”.</div>`
              : groups.map(
                  ([letter, opts]) => html`
                    <section class="modal-group">
                      ${letter ? html`<div class="modal-group-head">${letter}</div>` : nothing}
                      <div class="modal-group-rows">
                        ${opts.map((option) =>
                          this._renderRow(option, selected, () => this._draftToggle(option.id)),
                        )}
                      </div>
                    </section>
                  `,
                )}
          </div>
          <footer class="modal-foot">
            ${selected.size === 0
              ? html`<span class="modal-foot-meta">No ${config.label.toLowerCase()} selected</span>`
              : html`<button
                  type="button"
                  class="modal-foot-clear"
                  @click=${() => (this._draftSelected = new Set())}
                >
                  Clear ${selected.size} selected
                </button>`}
            <button class="btn btn-primary" @click=${this._closeMore}>View results</button>
          </footer>
        </div>
      </div>
    `
  }

  render() {
    const filters = this._filters
    return html`
      <aside class="filters" aria-label="Filters">
        <div class="local-only-toggle">
          <label class="local-only-toggle-row">
            <span class="local-only-toggle-text">
              <span class="local-only-toggle-label">Local control only</span>
              <span class="local-only-toggle-hint"
                >Hide devices that need an internet connection</span
              >
            </span>
            <span class=${"switch" + (filters.localOnly ? " is-on" : "")}>
              <input
                type="checkbox"
                .checked=${filters.localOnly}
                aria-label="Local control only"
                @change=${(e: Event) => this._setLocal((e.target as HTMLInputElement).checked)}
              />
              <span class="switch-track"></span>
              <span class="switch-thumb"></span>
            </span>
          </label>
        </div>
        ${this._dimensions.map((config) => this._renderGroup(config, filters))}
      </aside>
      ${this._moreDim ? this._renderMore() : nothing}
    `
  }
}

defineElementOnce("device-filters", DeviceFilters)

declare global {
  interface HTMLElementTagNameMap {
    "device-filters": DeviceFilters
  }
  interface WindowEventMap {
    "browse:open-filter": CustomEvent<{ dim: FacetDimension }>
  }
}
