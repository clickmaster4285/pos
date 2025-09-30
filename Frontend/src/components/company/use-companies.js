"use client"

import useSWR, { mutate as globalMutate } from "swr"
import type { Company, CompanyStatus } from "@/lib/types/company"

const STORAGE_KEY = "superadmin_companies_v1"

function readCompanies(): Company[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seeded = generateMockCompanies()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    const parsed = JSON.parse(raw) as Company[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCompanies(companies: Company[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function generateMockCompanies(): Company[] {
  const names = [
    "AutoDynamics",
    "DriveLogic",
    "TorqueTech",
    "MotorMind",
    "FleetFusion",
    "GearGrid",
    "Ignition Labs",
    "RoadSense",
    "PistonWorks",
    "DynoCore",
    "Vehicore",
    "AutonomIQ",
    "CruiseCloud",
    "WrenchWare",
    "ChassisSoft",
    "Pitlane Pro",
    "RevSuite",
    "TelemX",
    "TrackTrace",
    "LubeLink",
    "EcoMotors",
    "TireTrack",
    "LoopDrive",
    "BrakeBeam",
    "MetroAuto",
    "HexaTorque",
    "Sparkline Auto",
    "GridGarage",
    "OctaneOps",
    "AutoVista",
    "AxleAI",
    "GasketGo",
  ]
  const industries = ["Telematics", "Dealership", "Fleet Management", "Diagnostics", "Garage Ops", "Supply Chain"]

  const now = Date.now()
  const items: Company[] = []
  for (let i = 0; i < 32; i++) {
    const createdAt = new Date(now - i * 1000 * 60 * 60 * 24).toISOString()
    items.push({
      id: genId(),
      name: names[i % names.length],
      industry: industries[i % industries.length],
      status: i % 5 === 0 ? "Inactive" : "Active",
      usersCount: 5 + ((i * 7) % 97),
      createdAt,
    })
  }
  return items
}

type UpsertPayload = {
  name: string
  industry: string
  status: CompanyStatus
  usersCount: number
}

export function useCompanies() {
  const { data, isLoading, mutate } = useSWR<Company[]>(
    "companies",
    async () => {
      // Simulate fetch from mock backend
      const list = readCompanies()
      // Sort newest first for consistency
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    { revalidateOnFocus: false },
  )

  async function createCompany(payload: UpsertPayload) {
    const current = readCompanies()
    const newItem: Company = {
      id: genId(),
      name: payload.name.trim(),
      industry: payload.industry.trim(),
      status: payload.status,
      usersCount: Math.max(0, Math.floor(payload.usersCount) || 0),
      createdAt: new Date().toISOString(),
    }
    const next = [newItem, ...current]
    writeCompanies(next)
    await mutate(next, { revalidate: false })
    await globalMutate("companies")
    return newItem
  }

  async function updateCompany(id: string, payload: UpsertPayload) {
    const current = readCompanies()
    const idx = current.findIndex((c) => c.id === id)
    if (idx === -1) return
    const updated: Company = {
      ...current[idx],
      name: payload.name.trim(),
      industry: payload.industry.trim(),
      status: payload.status,
      usersCount: Math.max(0, Math.floor(payload.usersCount) || 0),
    }
    const next = [...current]
    next.splice(idx, 1, updated)
    writeCompanies(next)
    await mutate(next, { revalidate: false })
    await globalMutate("companies")
    return updated
  }

  async function deleteCompany(id: string) {
    const current = readCompanies()
    const next = current.filter((c) => c.id !== id)
    writeCompanies(next)
    await mutate(next, { revalidate: false })
    await globalMutate("companies")
  }

  return {
    companies: data ?? [],
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}
