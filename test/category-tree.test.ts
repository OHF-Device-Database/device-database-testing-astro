import { describe, expect, it } from "vitest"
import { categoryQueryIds, topLevelCategory, topLevelCategoryCounts } from "../src/lib/category-tree"

// Shaped like the live dimensions response: parent counts are rollups that
// include descendants, and children carry the direct tags.
const TREE = {
  cleaning: {
    name: "Cleaning",
    count: 127,
    children: { vacuum: { name: "Vacuum", count: 127, children: {} } },
  },
  "security-and-access-control": {
    name: "Security and access control",
    count: 716,
    children: {
      camera: { name: "Camera", count: 610, children: {} },
      "alarm-and-siren": { name: "Alarm and siren", count: 6, children: {} },
    },
  },
  lighting: { name: "Lighting", count: 1441, children: {} },
}

describe("categoryQueryIds", () => {
  it("expands a top-level id to itself plus all descendants", () => {
    const ids = categoryQueryIds(TREE)
    expect(ids.cleaning).toEqual(["cleaning", "vacuum"])
    expect(ids["security-and-access-control"]).toEqual([
      "security-and-access-control",
      "camera",
      "alarm-and-siren",
    ])
    expect(ids.lighting).toEqual(["lighting"])
  })
})

describe("topLevelCategory", () => {
  it("maps every id to its top-level ancestor", () => {
    const top = topLevelCategory(TREE)
    expect(top.vacuum).toBe("cleaning")
    expect(top.camera).toBe("security-and-access-control")
    expect(top.lighting).toBe("lighting")
  })
})

describe("topLevelCategoryCounts", () => {
  it("returns the rollup count per top-level category", () => {
    expect(topLevelCategoryCounts(TREE)).toEqual({
      cleaning: 127,
      "security-and-access-control": 716,
      lighting: 1441,
    })
  })
})
