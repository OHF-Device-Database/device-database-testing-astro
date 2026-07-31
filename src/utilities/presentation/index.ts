import {
	ArrowLeft,
	ArrowRight,
	Blinds,
	Bot,
	Car,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleQuestionMark,
	CloudSun,
	Droplet,
	Droplets,
	ExternalLink,
	Funnel,
	LayoutGrid,
	Lightbulb,
	List,
	Lock,
	PawPrint,
	Pencil,
	Printer,
	Radar,
	Refrigerator,
	Router,
	Search,
	Speaker,
	Sprout,
	Thermometer,
	ToggleRight,
	Users,
	Waves,
	X,
	Zap,
} from "lucide";
import type { IconNode } from "lucide";

import { Unknown } from "../../types/unknown";
import { peek } from "./preset";
import type { DeviceCategoryTopLevelId } from "../../types/category";
import type { DeviceConnectivityId } from "../../types/device";
import type { QuickFilterId } from "../../types/quick-filter";
import type { PresentationRenderPreset } from "./preset";

type PresentationLabeled = {
	label: string;
};

const PresentationRenderableSymbol = Symbol("PresentationIconRenderable");
type PresentationRenderableInner = IconNode;
type PresentationRenderable = {
	renderable: {
		[PresentationRenderableSymbol]: PresentationRenderableInner;
	};
};
const renderable = (inner: PresentationRenderableInner) =>
	({ renderable: { [PresentationRenderableSymbol]: inner } }) as const;

type PresentationStylesheetClass = {
	cls: string;
};

type PresentationStylesheetColor = {
	color: string;
};

const PRESENTATION_ENTITY_DEVICE_CONNECTIVITY = {
	online: {
		cls: "net-yes",
		label: "Requires internet",
		color: "var(--neutral-400)",
	},
	offline: {
		cls: "net-no",
		label: "Local connection",
		color: "var(--success)",
	},
} as const satisfies Record<
	DeviceConnectivityId,
	PresentationLabeled &
		PresentationStylesheetClass &
		PresentationStylesheetColor
>;

const PRESENTATION_ENTITY_DEVICE_CATEGORY = {
	"button-switch-and-control": {
		...renderable(ToggleRight),
		label: "Buttons, switches, and controls",
	},
	cleaning: { ...renderable(Bot), label: "Cleaning" },
	"climate-control": { ...renderable(Thermometer), label: "Climate control" },
	cover: { ...renderable(Blinds), label: "Cover" },
	entertainment: { ...renderable(Speaker), label: "Entertainment" },
	garden: { ...renderable(Sprout), label: "Garden" },
	irrigation: { ...renderable(Droplets), label: "Irrigation" },
	"kitchen-and-household": {
		...renderable(Refrigerator),
		label: "Kitchen and household",
	},
	lighting: { ...renderable(Lightbulb), label: "Lighting" },
	monitoring: { ...renderable(Radar), label: "Monitoring" },
	networking: { ...renderable(Router), label: "Networking" },
	pets: { ...renderable(PawPrint), label: "Pets" },
	"pool-and-spa": { ...renderable(Waves), label: "Pool and spa" },
	"power-and-energy": { ...renderable(Zap), label: "Power and energy" },
	printing: { ...renderable(Printer), label: "Printing" },
	"security-and-access-control": {
		...renderable(Lock),
		label: "Security and access control",
	},
	"vehicle-and-mobility": {
		...renderable(Car),
		label: "Vehicles and mobility",
	},
	"water-management": { ...renderable(Droplet), label: "Water management" },
	weather: { ...renderable(CloudSun), label: "Weather" },
} as const satisfies Record<
	DeviceCategoryTopLevelId,
	PresentationRenderable & PresentationLabeled
>;

const PRESENTATION_ENTITY_QUICK_FILTER = {
	"sensors-local": {
		...renderable(Radar),
		label: "Sensors with local connection",
	},
	"lighting-local": {
		...renderable(Lightbulb),
		label: "Lighting with local connection",
	},
	energy: { ...renderable(Zap), label: "Energy monitoring" },
} as const satisfies Record<
	QuickFilterId,
	PresentationRenderable & PresentationLabeled
>;

const PRESENTATION_GENERIC = {
	search: renderable(Search),
	filter: renderable(Funnel),
	arrow: renderable(ArrowRight),
	arrowL: renderable(ArrowLeft),
	users: renderable(Users),
	x: renderable(X),
	pencil: renderable(Pencil),
	check: renderable(Check),
	open: renderable(ExternalLink),
	list: renderable(List),
	grid: renderable(LayoutGrid),
	chevronL: renderable(ChevronLeft),
	chevronR: renderable(ChevronRight),
	chevronDown: renderable(ChevronDown),
} as const;

export const device = {
	connectivity: (self: DeviceConnectivityId | Unknown) =>
		self !== Unknown
			? PRESENTATION_ENTITY_DEVICE_CONNECTIVITY[self]
			: ({
					cls: "net-unknown",
					label: "Connectivity unknown",
					color: "var(--neutral-400)",
				} as const),
	category: (self: DeviceCategoryTopLevelId | Unknown) =>
		self !== Unknown
			? PRESENTATION_ENTITY_DEVICE_CATEGORY[self]
			: ({
					...renderable(CircleQuestionMark),
					label: "Category unknown",
				} as const),
};
export const quickFilter = (self: QuickFilterId) =>
	PRESENTATION_ENTITY_QUICK_FILTER[self];

export const generic = (self: keyof typeof PRESENTATION_GENERIC) =>
	PRESENTATION_GENERIC[self];

export const render = (
	renderable: PresentationRenderable,
	preset: PresentationRenderPreset,
) => {
	const peekedRenderable = renderable.renderable[PresentationRenderableSymbol];
	const peekedPreset = peek(preset);

	const children = peekedRenderable
		.map(([tag, attrs]) => {
			const parts = Object.entries(attrs).map(
				([key, value]) => `${key}="${value}"`,
			);
			return `<${tag} ${parts.join(" ")}/>`;
		})
		.join("");
	const classAttr =
		typeof peekedPreset.cls !== "undefined"
			? ` class="${peekedPreset.cls}"`
			: "";
	return `<svg${classAttr} xmlns="http://www.w3.org/2000/svg" width="${peekedPreset.size}" height="${peekedPreset.size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${peekedPreset.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
};
