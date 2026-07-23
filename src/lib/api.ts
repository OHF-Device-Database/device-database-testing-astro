import {
  apiConfigured,
  BROWSE_PAGE_SIZE,
  getDerivedDevice,
  getDeviceCount,
  getDevicesPage,
  getDimensions,
  type DerivedDeviceMono,
  type DerivedDevicePoly,
  type DeviceQuery,
  type Dimensions,
} from "./api-client"
import { applyFilters, type BrowseFilters, type ManufacturerFacet } from "./browse-filters"
import { DEFAULT_CATEGORY } from "./categories"
import { categoryQueryIds, topLevelCategory, topLevelCategoryCounts } from "./category-tree"
import { Device, type VersionInfo } from "./device"
import { MOCK_DEVICES } from "./mock-devices"

type VersionInfoInput = VersionInfo

function cleanVersion(raw: string | undefined): string {
  return (raw ?? "").replace(/^"+|"+$/g, "").trim()
}

function deviceName(dto: DerivedDeviceMono): string {
  return dto.model || dto.model_id || dto.integration.name || "Unknown device"
}

type ApiVersionEntry = { version: string; active?: number; first_encountered?: string }

function versionInfo(entries: ApiVersionEntry[]): VersionInfoInput[] {
  const byVersion = new Map<string, VersionInfoInput>()

  for (const entry of entries) {
    const version = cleanVersion(entry.version)
    if (!version) continue
    const existing = byVersion.get(version)
    if (existing) {
      if (entry.active !== undefined) existing.active = (existing.active ?? 0) + entry.active
      if (
        entry.first_encountered &&
        (!existing.firstEncountered || entry.first_encountered < existing.firstEncountered)
      ) {
        existing.firstEncountered = entry.first_encountered
      }
    } else {
      byVersion.set(version, {
        version,
        active: entry.active,
        firstEncountered: entry.first_encountered ?? "",
      })
    }
  }

  return [...byVersion.values()].sort((a, b) =>
    (a.firstEncountered ?? "").localeCompare(b.firstEncountered ?? ""),
  )
}

function entityDomains(entities: { domain: string }[]): string[] {
  return [...new Set(entities.map((entity) => entity.domain).filter(Boolean))]
}

function toDevice(
  dto: DerivedDevicePoly | DerivedDeviceMono,
  id: string,
  topOf: Record<string, string>,
): Device {
  const software = versionInfo(dto.versions.software)
  const hardware = versionInfo(dto.versions.hardware)
  const softwareVersions = software.map((entry) => entry.version)
  const hardwareVersions = hardware.map((entry) => entry.version)

  return Device.parse({
    id,
    name: deviceName(dto),
    manufacturer: dto.manufacturer,
    model: dto.model_id || dto.model || "",
    category:
      dto.categories.map((c) => topOf[c.id]).find(Boolean) ??
      dto.categories[0]?.id ??
      DEFAULT_CATEGORY,
    connectivity: dto.connectivity,
    summary: "",
    reports: dto.count,
    installs: dto.count,
    haIntegration: dto.integration.name || dto.integration.domain || "",
    haIntegrationDomain: dto.integration.domain || "",
    entityTypes: entityDomains(dto.entities),
    softwareVersion: softwareVersions[softwareVersions.length - 1] ?? "",
    softwareVersions,
    hardwareVersions,
    softwareVersionInfo: software,
    hardwareVersionInfo: hardware,
    firstSeen: dto.first_encountered ?? "",
    lastVerified: "",
  })
}

// The devices endpoint matches direct category tags only, so a selected top-level
// category expands to itself plus all of its descendants (see category-tree.ts).
async function categoryTree(): Promise<Dimensions["categories"]> {
  const { categories } = await getDimensions()

  return categories
}

async function filtersToQuery(
  filters: BrowseFilters,
  page: number,
  size: number,
): Promise<DeviceQuery> {
  const query: DeviceQuery = { page, size, term: filters.q }
  const queryIds = categoryQueryIds(await categoryTree())
  const categories = [...filters.category].flatMap((id) => queryIds[id] ?? [id])
  if (categories.length) {
    if (filters.categoryMode === "exclude") query.notCategory = categories
    else query.category = categories
  }
  const manufacturers = [...filters.manufacturer]
  if (manufacturers.length) {
    if (filters.manufacturerMode === "exclude") query.notManufacturer = manufacturers
    else query.manufacturer = manufacturers
  }
  if (filters.localOnly) {
    query.notConnectivity = ["online"]
  }

  return query
}

export interface DeviceResults {
  devices: Device[]
  total: number
  page: number
  size: number
  pageCount: number
}

export async function fetchDeviceResults(
  filters: BrowseFilters,
  page = 0,
  size = BROWSE_PAGE_SIZE,
): Promise<DeviceResults> {
  if (!apiConfigured) {
    const matched = applyFilters(MOCK_DEVICES, filters)
    const start = page * size

    return {
      devices: matched.slice(start, start + size),
      total: matched.length,
      page,
      size,
      pageCount: Math.max(1, Math.ceil(matched.length / size)),
    }
  }
  const [result, topOf] = await Promise.all([
    filtersToQuery(filters, page, size).then(getDevicesPage),
    categoryTree().then(topLevelCategory),
  ])

  return {
    devices: result.devices.map((dto) => toDevice(dto, dto.id, topOf)),
    total: result.total,
    page: result.page,
    size: result.size,
    pageCount: Math.max(1, Math.ceil(result.total / result.size)),
  }
}

export async function fetchDeviceCount(): Promise<number> {
  if (!apiConfigured) {
    return MOCK_DEVICES.length
  }

  return getDeviceCount()
}

export async function fetchManufacturers(): Promise<ManufacturerFacet[]> {
  if (!apiConfigured) {
    const counts = new Map<string, number>()
    for (const device of MOCK_DEVICES) {
      counts.set(device.manufacturer, (counts.get(device.manufacturer) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }
  const { manufacturers } = await getDimensions()

  return manufacturers
}

export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  if (!apiConfigured) {
    const counts: Record<string, number> = {}
    for (const device of MOCK_DEVICES) {
      counts[device.category] = (counts[device.category] ?? 0) + 1
    }

    return counts
  }
  return topLevelCategoryCounts(await categoryTree())
}

export async function fetchDevice(id: string): Promise<Device | undefined> {
  if (!apiConfigured) {
    return MOCK_DEVICES.find((candidate) => candidate.id === id)
  }
  const [dto, topOf] = await Promise.all([getDerivedDevice(id), categoryTree().then(topLevelCategory)])

  return dto ? toDevice(dto, id, topOf) : undefined
}
