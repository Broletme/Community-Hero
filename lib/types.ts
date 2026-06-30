export type Category = 'pothole' | 'streetlight' | 'water_leak' | 'waste' | 'other'
export type Severity = 'low' | 'medium' | 'high'
export type Status = 'reported' | 'verified' | 'resolved'

export interface Report {
  id: string
  image_url: string
  category: Category
  severity: Severity
  description: string
  lat: number
  lng: number
  status: Status
  cluster_id: string | null
  verification_count: number
  created_at: string
}

/** A cluster is the root report + all its duplicates merged together */
export interface ClusterGroup {
  /** The cluster root id (coalesce(cluster_id, id)) */
  clusterId: string
  /** The root/representative report to display */
  root: Report
  /** Total confirmation count across all merged reports */
  confirmations: number
}

export interface CategorizationResult {
  category: Category
  severity: Severity
  description: string
  fallback?: boolean
}

export interface SubmitReportResult {
  report: Report
  merged: boolean
  clusterCount: number
}

export const CATEGORY_LABELS: Record<Category, string> = {
  pothole: 'Pothole',
  streetlight: 'Broken Streetlight',
  water_leak: 'Water Leak',
  waste: 'Waste / Garbage',
  other: 'Other',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  pothole: '🕳️',
  streetlight: '💡',
  water_leak: '💧',
  waste: '🗑️',
  other: '⚠️',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#5B8C5A',
  medium: '#D4A24C',
  high: '#C84B31',
}

export const STATUS_LABELS: Record<Status, string> = {
  reported: 'Reported',
  verified: 'Verified',
  resolved: 'Resolved',
}

export const STATUS_NEXT: Record<Status, Status | null> = {
  reported: 'verified',
  verified: 'resolved',
  resolved: null,
}
