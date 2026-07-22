export const DEFAULT_UI_CATEGORY = "hubs"

export const API_TO_UI_CATEGORY: Record<string, string> = {
  // printing
  printing: "kitchen",
  "3d-printer": "kitchen",
  "ink-printer": "kitchen",

  // networking / hubs
  networking: "hubs",
  router: "hubs",
  "smart-home-hub": "hubs",

  // buttons, switches and controls
  "button-switch-and-control": "controls",
  button: "controls",
  "control-panel": "controls",
  remote: "controls",
  switch: "controls",

  // cleaning
  cleaning: "cleaning",
  vacuum: "cleaning",

  // climate control
  "climate-control": "climate",
  "air-conditioner": "climate",
  "air-purifier": "climate",
  dehumidifier: "climate",
  fan: "climate",
  heater: "climate",
  "heat-pump": "climate",
  humidifier: "climate",
  hvac: "climate",
  thermostat: "climate",

  // irrigation / water
  irrigation: "irrigation",
  "water-management": "irrigation",
  "water-heater": "irrigation",
  valve: "irrigation",

  // kitchen and household
  "kitchen-and-household": "kitchen",
  refrigerator: "kitchen",
  scale: "kitchen",
  "sous-vide": "kitchen",

  // lighting
  lighting: "lighting",
  bulb: "lighting",

  // occupancy / presence / motion
  monitoring: "presence",
  "motion-and-presence-sensor": "presence",
  "device-tracker": "presence",

  // sensors
  "air-quality-sensor": "sensors",
  "contact-sensor": "sensors",
  "environment-sensor": "sensors",
  weather: "sensors",

  // pool and spa
  "pool-and-spa": "pool",

  // garden
  garden: "irrigation",
  "lawn-mower": "cleaning",

  // pets
  pets: "pets",
  "pet-feeder": "pets",

  // power and energy
  "power-and-energy": "power",
  metering: "power",
  "plug-and-outlet": "power",
  "ev-charging": "power",

  // security and access control
  "security-and-access-control": "security",
  "alarm-and-siren": "security",
  deadbolt: "security",
  "door-lock": "security",
  "garage-door": "security",
  "gate-controller": "security",
  keypad: "security",
  doorbell: "security",

  // cameras
  camera: "cameras",

  // entertainment
  entertainment: "entertainment",
  speaker: "entertainment",
  tv: "entertainment",
  streaming: "entertainment",

  // vehicles and mobility
  "vehicle-and-mobility": "vehicles",
  car: "vehicles",

  // window treatments and shading
  cover: "shading",
  blind: "shading",
  shade: "shading",
  curtain: "shading",
  awning: "shading",
}

export function toUiCategory(apiCategoryIds: readonly string[]): string {
  for (const id of apiCategoryIds) {
    const mapped = API_TO_UI_CATEGORY[id]

    if (mapped) {
      return mapped
    }
  }

  return DEFAULT_UI_CATEGORY
}

export const UI_TO_API_CATEGORIES: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {}

  for (const [apiId, uiId] of Object.entries(API_TO_UI_CATEGORY)) {
    ;(out[uiId] ??= []).push(apiId)
  }

  return out
})()

interface CategoryCountNode {
  count: number
  children: Record<string, CategoryCountNode>
}

// Per-UI-category device counts from the dimensions tree. Node counts in the tree are
// hierarchical rollups (a parent includes all descendants), but the devices endpoint
// matches direct tags only, so a node's own contribution is count minus the child sum.
// Summing those per mapped UI category makes each count equal what filtering by that
// UI category actually returns.
export function uiCategoryCounts(tree: Record<string, CategoryCountNode>): Record<string, number> {
  const out: Record<string, number> = {}
  const walk = (nodes: Record<string, CategoryCountNode>) => {
    for (const [apiId, node] of Object.entries(nodes)) {
      const childSum = Object.values(node.children).reduce((sum, child) => sum + child.count, 0)
      const direct = Math.max(0, node.count - childSum)
      const uiId = API_TO_UI_CATEGORY[apiId]
      if (uiId && direct > 0) {
        out[uiId] = (out[uiId] ?? 0) + direct
      }
      walk(node.children)
    }
  }
  walk(tree)

  return out
}

export function toApiCategories(uiCategoryIds: Iterable<string>): string[] {
  const out: string[] = []

  for (const uiId of uiCategoryIds) {
    out.push(...(UI_TO_API_CATEGORIES[uiId] ?? []))
  }

  return out
}
