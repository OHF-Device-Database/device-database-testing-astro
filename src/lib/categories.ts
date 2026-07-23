import type { Category } from "./device";

// todo: these should come from endpoint
export const DEVICE_CATEGORIES: Category[] = [
    { id: "button-switch-and-control", label: "Buttons, switches, and controls" },
    { id: "cleaning", label: "Cleaning" },
    { id: "climate-control", label: "Climate control" },
    { id: "cover", label: "Cover" },
    { id: "entertainment", label: "Entertainment" },
    { id: "garden", label: "Garden" },
    { id: "irrigation", label: "Irrigation" },
    { id: "kitchen-and-household", label: "Kitchen and household" },
    { id: "lighting", label: "Lighting" },
    { id: "monitoring", label: "Monitoring" },
    { id: "networking", label: "Networking" },
    { id: "pets", label: "Pets" },
    { id: "pool-and-spa", label: "Pool and spa" },
    { id: "power-and-energy", label: "Power and energy" },
    { id: "printing", label: "Printing" },
    { id: "security-and-access-control", label: "Security and access control" },
    { id: "vehicle-and-mobility", label: "Vehicles and mobility" },
    { id: "weather", label: "Weather" },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
    DEVICE_CATEGORIES.map((category) => [category.id, category.label]),
);
