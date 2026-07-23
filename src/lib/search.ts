import { DEVICE_CATEGORIES } from "./categories"
import type { Category } from "./device"

export interface QuickFilter {
  id: string
  title: string
  icon: string
  breadcrumb: string
  filters: { category?: string[]; manufacturer?: string[]; localOnly?: boolean }
}

export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "sensors-local",
    title: "Sensors with local connection",
    icon: "monitoring",
    breadcrumb: "Sensors · Occupancy and motion · Local connection",
    filters: { category: ["monitoring", "weather"], localOnly: true },
  },
  {
    id: "lighting-local",
    title: "Lighting with local connection",
    icon: "lighting",
    breadcrumb: "Lighting · Local connection",
    filters: { category: ["lighting"], localOnly: true },
  },
  {
    id: "cameras-local",
    title: "Cameras with local connection",
    icon: "camera",
    breadcrumb: "Cameras and NVRs · Local connection",
    filters: { category: ["camera"], localOnly: true },
  },
  {
    id: "hubs",
    title: "Hubs and bridges",
    icon: "networking",
    breadcrumb: "Hubs, routers and bridges",
    filters: { category: ["networking"] },
  },
  {
    id: "energy",
    title: "Energy monitoring",
    icon: "power-and-energy",
    breadcrumb: "Power and energy",
    filters: { category: ["power-and-energy"] },
  },
]

export interface SuggestDevice {
  id: string
  name: string
  manufacturer: string
  category: string
}

export interface Suggestions {
  categories?: Category[]
  devices?: SuggestDevice[]
  deviceMore?: number
  manufacturers?: string[]
}

export const FACET_SUGGEST_LIMIT = 5

export function pickFacetSuggestions(
  q: string,
  manufacturers: string[],
  categories: Category[] = DEVICE_CATEGORIES,
): { categories: Category[]; manufacturers: string[] } {
  const term = q.trim().toLowerCase()

  if (!term) {
    return { categories: [], manufacturers: [] }
  }

  return {
    categories: categories
      .filter((c) => c.label.toLowerCase().includes(term))
      .slice(0, FACET_SUGGEST_LIMIT),
    manufacturers: manufacturers
      .filter((m) => m.toLowerCase().includes(term))
      .slice(0, FACET_SUGGEST_LIMIT),
  }
}

export async function fetchSuggestions(
  q: string,
  signal?: AbortSignal,
): Promise<Suggestions | null> {
  const term = q.trim()

  if (!term) {
    return null
  }

  const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal })

  if (!res.ok) {
    return null
  }

  const data = (await res.json()) as Suggestions
  const hasContent = (["categories", "devices", "manufacturers"] as const).some(
    (key) => (data[key]?.length ?? 0) > 0,
  )

  return hasContent ? data : null
}
