"use client"

export type PatientProfile = {
  name: string
  age: number | null
  medicalHistory: string
}

export type PatientVisit = {
  date: string
  doctor: string
  notes: string
}

export type PatientHistoryEntry = {
  id: string
  createdAt: string
  symptoms: string
  urgency: "LOW" | "MEDIUM" | "HIGH"
  explanation: string
  visits: PatientVisit[]
}

export type SyncQueueItem = {
  id: string
  type: "history" | "profile" | "sos" | "alert"
  payload: unknown
  createdAt: string
}

const KEYS = {
  profile: "patient-profile-v1",
  history: "patient-history-v2",
  notes: "patient-notes",
  sync: "offline-sync-queue-v1",
  sos: "sos-events-v1",
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function queueSync(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  const list = readJSON<SyncQueueItem[]>(KEYS.sync, [])
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...item,
  })
  writeJSON(KEYS.sync, list.slice(0, 200))
}

export function getPatientProfile(): PatientProfile {
  return readJSON<PatientProfile>(KEYS.profile, { name: "", age: null, medicalHistory: "" })
}

export function savePatientProfile(profile: PatientProfile) {
  writeJSON(KEYS.profile, profile)
  queueSync({ type: "profile", payload: profile })
}

export function getPatientHistory(): PatientHistoryEntry[] {
  return readJSON<PatientHistoryEntry[]>(KEYS.history, [])
}

export function addPatientHistory(entry: Omit<PatientHistoryEntry, "id" | "createdAt" | "visits">) {
  const list = getPatientHistory()
  const next: PatientHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    visits: [],
    ...entry,
  }
  list.unshift(next)
  writeJSON(KEYS.history, list.slice(0, 100))
  queueSync({ type: "history", payload: next })
  return next
}

export function addVisit(entryId: string, visit: PatientVisit) {
  const list = getPatientHistory()
  const updated = list.map((item) => (item.id === entryId ? { ...item, visits: [...item.visits, visit] } : item))
  writeJSON(KEYS.history, updated)
  queueSync({ type: "history", payload: { entryId, visit } })
}

export function getPatientNotes(): string {
  return localStorage.getItem(KEYS.notes) || ""
}

export function savePatientNotes(notes: string) {
  localStorage.setItem(KEYS.notes, notes)
}

export function addSOSEvent(payload: { area: string; contact: string; reason: string }) {
  const list = readJSON<Array<{ id: string; createdAt: string; area: string; contact: string; reason: string }>>(KEYS.sos, [])
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  }
  list.unshift(event)
  writeJSON(KEYS.sos, list.slice(0, 50))
  queueSync({ type: "sos", payload: event })
}

export function getSOSEvents() {
  return readJSON<Array<{ id: string; createdAt: string; area: string; contact: string; reason: string }>>(KEYS.sos, [])
}

export function getSyncQueue() {
  return readJSON<SyncQueueItem[]>(KEYS.sync, [])
}

