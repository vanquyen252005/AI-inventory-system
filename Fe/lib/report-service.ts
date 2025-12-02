import { fetchWithAuth } from "./api-client"

const INVENTORY_API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL || "http://localhost:4001"

export interface SummaryStats {
  totalScans: number
  totalAssets: number
  maintenanceCount: number
  totalValue: number
}

export interface ChartData {
  month: string
  scans: number
}

export interface DistributionData {
  name: string
  value: number
}

export async function getSummary(): Promise<SummaryStats> {
  return fetchWithAuth(`${INVENTORY_API_URL}/reports/summary`)
}

export async function getTrends(): Promise<ChartData[]> {
  return fetchWithAuth(`${INVENTORY_API_URL}/reports/trends`)
}

export async function getDistribution(): Promise<DistributionData[]> {
  return fetchWithAuth(`${INVENTORY_API_URL}/reports/issues`)
}