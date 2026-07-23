import {
    Search,
    Funnel,
    ArrowRight,
    ArrowLeft,
    Users,
    X,
    Pencil,
    Router,
    ToggleRight,
    Video,
    Bot,
    Thermometer,
    Droplets,
    Refrigerator,
    Lightbulb,
    Radar,
    Waves,
    PawPrint,
    Zap,
    Lock,
    Speaker,
    Car,
    Blinds,
    Printer,
    CloudSun,
    Sprout,
    Droplet,
    Check,
    ExternalLink,
    List,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    type IconNode,
} from "lucide";

const ICONS: Record<string, IconNode> = {
    search: Search,
    filter: Funnel,
    arrow: ArrowRight,
    arrowL: ArrowLeft,
    users: Users,
    x: X,
    pencil: Pencil,
    check: Check,
    open: ExternalLink,
    list: List,
    grid: LayoutGrid,
    chevronL: ChevronLeft,
    chevronR: ChevronRight,
    chevronDown: ChevronDown,
};

// Keyed by the API's top-level category ids, plus the child ids that quick
// filters target directly (camera).
const GLYPHS: Record<string, IconNode> = {
    "button-switch-and-control": ToggleRight,
    camera: Video,
    cleaning: Bot,
    "climate-control": Thermometer,
    cover: Blinds,
    entertainment: Speaker,
    garden: Sprout,
    irrigation: Droplets,
    "kitchen-and-household": Refrigerator,
    lighting: Lightbulb,
    monitoring: Radar,
    networking: Router,
    pets: PawPrint,
    "pool-and-spa": Waves,
    "power-and-energy": Zap,
    printing: Printer,
    "security-and-access-control": Lock,
    "vehicle-and-mobility": Car,
    "water-management": Droplet,
    weather: CloudSun,
};

function render(node: IconNode, size: number, strokeWidth: number, className?: string): string {
    const children = node
        .map(([tag, attrs]) => {
            const parts = Object.entries(attrs).map(([key, value]) => `${key}="${value}"`);
            return `<${tag} ${parts.join(" ")}/>`;
        })
        .join("");
    const classAttr = className ? ` class="${className}"` : "";
    return `<svg${classAttr} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}

export function icon(name: string, size = 20, strokeWidth = 2): string {
    const node = ICONS[name] ?? Search;
    return render(node, size, strokeWidth, "icon");
}

export function categoryGlyph(category: string, size = 40): string {
    const node = GLYPHS[category] ?? GLYPHS.networking;
    return render(node, size, 1.5);
}
