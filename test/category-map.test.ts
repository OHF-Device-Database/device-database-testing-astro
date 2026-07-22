import { describe, expect, it } from "vitest"
import { uiCategoryCounts } from "../src/lib/category-map"

describe("uiCategoryCounts", () => {
  it("uses direct counts, not hierarchical rollups", () => {
    const counts = uiCategoryCounts({
      cleaning: { count: 129, children: { vacuum: { count: 129, children: {} } } },
    })
    expect(counts.cleaning).toBe(129)
  })

  it("splits a subtree across UI categories without double counting", () => {
    const counts = uiCategoryCounts({
      "security-and-access-control": {
        count: 717,
        children: {
          camera: { count: 610, children: {} },
          "alarm-and-siren": { count: 7, children: {} },
        },
      },
    })
    expect(counts.security).toBe(107)
    expect(counts.cameras).toBe(610)
  })

  it("aggregates separate api ids mapped to the same UI category", () => {
    const counts = uiCategoryCounts({
      irrigation: { count: 31, children: {} },
      "water-management": { count: 7, children: { "water-heater": { count: 3, children: {} } } },
    })
    expect(counts.irrigation).toBe(31 + 4 + 3)
  })

  it("ignores api ids with no UI mapping", () => {
    const counts = uiCategoryCounts({
      "mystery-gadget": { count: 5, children: {} },
    })
    expect(counts).toEqual({})
  })
})
