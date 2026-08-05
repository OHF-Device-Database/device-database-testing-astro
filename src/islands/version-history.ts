import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";
import { defineElementOnce } from "../utilities/define-element.js";
import * as presentation from "../utilities/presentation";
import { PresentationRenderPresetRoleIcon } from "../utilities/presentation/preset.js";

export interface VersionEntry {
	version: string;
	current: boolean;
	installs?: number | undefined;
}

export class VersionHistory extends LitElement {
	@property({ type: Array }) entries: VersionEntry[] = [];
	@property() label = m.version_history_show();

	@state() private _open = false;

	private _onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			this._close();
		}
	};

	protected override createRenderRoot(): HTMLElement {
		return this;
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._release();
	}

	private _openPanel = (): void => {
		this._open = true;
		document.body.classList.add("modal-open");
		document.addEventListener("keydown", this._onKey);
	};

	private _close = (): void => {
		this._open = false;
		this._release();
	};

	private _release(): void {
		document.body.classList.remove("modal-open");
		document.removeEventListener("keydown", this._onKey);
	}

	override render() {
		if (this.entries.length === 0) {
			return nothing;
		}
		return html`
			<button type="button" class="version-link" @click=${this._openPanel}>
				${this.label}
			</button>
			${
				this._open
					? html`
							<div
								class="vh-backdrop"
								role="presentation"
								@click=${this._close}
							>
								<div
									class="vh-panel"
									role="dialog"
									aria-modal="true"
									aria-label=${m.version_history_title()}
									@click=${(e: Event) => e.stopPropagation()}
								>
									<header class="vh-head">
										<button
											class="vh-close"
											aria-label=${m.version_history_close()}
											@click=${this._close}
										>
											${unsafeHTML(presentation.render(presentation.generic("x"), PresentationRenderPresetRoleIcon))}
										</button>
										<h2>${m.version_history_title()}</h2>
									</header>
									<ol class="vh-timeline">
										${this.entries.map(
											(entry) => html`
												<li
													class=${"vh-item" + (entry.current ? " is-current" : "")}
												>
													<span class="vh-dot"></span>
													<div class="vh-body">
														<div class="vh-ver">
															<span class="mono">${entry.version}</span>
															${entry.current ? html`<span class="vh-badge">${m.version_history_current()}</span>` : nothing}
														</div>
														${entry.installs ? html`<div class="vh-meta">${m.version_history_installs({ count: entry.installs.toLocaleString(getLocale()) })}</div>` : nothing}
													</div>
												</li>
											`,
										)}
									</ol>
								</div>
							</div>
						`
					: nothing
			}
		`;
	}
}

defineElementOnce("version-history", VersionHistory);

declare global {
	interface HTMLElementTagNameMap {
		"version-history": VersionHistory;
	}
}
