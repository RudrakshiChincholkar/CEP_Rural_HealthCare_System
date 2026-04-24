"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
  addVisit,
  getPatientHistory,
  getPatientNotes,
  getPatientProfile,
  getSyncQueue,
  savePatientNotes,
  savePatientProfile,
  type PatientHistoryEntry,
} from "@/lib/offline-health"

export default function HistoryPage() {
  const [entries, setEntries] = useState<PatientHistoryEntry[]>([])
  const [notes, setNotes] = useState("")
  const [profileName, setProfileName] = useState("")
  const [profileAge, setProfileAge] = useState("")
  const [profileHistory, setProfileHistory] = useState("")
  const [visitDoctor, setVisitDoctor] = useState("")
  const [visitNotes, setVisitNotes] = useState("")
  const [activeEntryId, setActiveEntryId] = useState("")
  const [syncCount, setSyncCount] = useState(0)

  useEffect(() => {
    setEntries(getPatientHistory())
    setNotes(getPatientNotes())
    const profile = getPatientProfile()
    setProfileName(profile.name)
    setProfileAge(profile.age ? String(profile.age) : "")
    setProfileHistory(profile.medicalHistory)
    setSyncCount(getSyncQueue().length)
  }, [])

  const saveNotes = () => {
    savePatientNotes(notes)
    setSyncCount(getSyncQueue().length)
  }

  const saveProfile = () => {
    savePatientProfile({
      name: profileName,
      age: profileAge ? Number(profileAge) : null,
      medicalHistory: profileHistory,
    })
    setSyncCount(getSyncQueue().length)
  }

  const attachVisit = () => {
    if (!activeEntryId || !visitDoctor || !visitNotes) return
    addVisit(activeEntryId, {
      date: new Date().toISOString(),
      doctor: visitDoctor,
      notes: visitNotes,
    })
    setEntries(getPatientHistory())
    setVisitDoctor("")
    setVisitNotes("")
    setSyncCount(getSyncQueue().length)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Patient History</h1>
        <p className="text-gray-300 mb-4">Includes profile, symptoms, triage reports, visits, prescriptions, and notes.</p>
        <p className="text-yellow-300 text-sm mb-4">This system provides guidance, not medical diagnosis.</p>
        <p className="text-xs text-gray-400 mb-4">Offline sync queue: {syncCount} pending item(s)</p>

        <div className="p-4 rounded border border-gray-700 bg-gray-900 mb-6">
          <h2 className="text-xl font-semibold mb-3">Patient Profile (Offline)</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="p-3 bg-black border border-gray-700 rounded text-lg" placeholder="Name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            <input className="p-3 bg-black border border-gray-700 rounded text-lg" placeholder="Age" value={profileAge} onChange={(e) => setProfileAge(e.target.value)} />
            <input className="p-3 bg-black border border-gray-700 rounded text-lg" placeholder="Medical history" value={profileHistory} onChange={(e) => setProfileHistory(e.target.value)} />
          </div>
          <button onClick={saveProfile} className="mt-3 px-6 py-3 text-lg bg-white text-black rounded">Save Profile</button>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-gray-400">No entries found yet. Run a triage check to generate your first report.</p>
          ) : (
            entries.map((entry, index) => (
              <div key={index} className="p-3 rounded border border-gray-700 bg-gray-900">
                <p className="text-sm text-gray-300">{new Date(entry.createdAt).toLocaleString()}</p>
                <p><strong>Symptoms:</strong> {entry.symptoms}</p>
                <p><strong>Assessment:</strong> {entry.explanation}</p>
                <p><strong>Urgency:</strong> {entry.urgency}</p>
                {entry.visits.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300">
                    <p className="font-semibold">Visits:</p>
                    {entry.visits.map((visit, idx) => (
                      <p key={idx}>- {new Date(visit.date).toLocaleDateString()}: {visit.doctor} - {visit.notes}</p>
                    ))}
                  </div>
                )}
                <button onClick={() => setActiveEntryId(entry.id)} className="mt-2 px-4 py-2 bg-white text-black rounded">Attach Visit</button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 rounded border border-gray-700 bg-gray-900">
          <h2 className="text-xl font-semibold mb-2">Doctor Visit Entry</h2>
          <p className="text-sm text-gray-300 mb-2">Selected entry: {activeEntryId || "None"}</p>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="p-3 bg-black border border-gray-700 rounded" placeholder="Doctor/Facility Name" value={visitDoctor} onChange={(e) => setVisitDoctor(e.target.value)} />
            <input className="p-3 bg-black border border-gray-700 rounded" placeholder="Visit notes/prescription" value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} />
          </div>
          <button onClick={attachVisit} className="mt-3 px-4 py-2 bg-white text-black rounded">Save Visit</button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Doctor Visits / Prescriptions / Notes</h2>
          <textarea className="w-full mt-2 h-28 p-3 bg-gray-900 border border-gray-700 rounded" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={saveNotes} className="mt-2 px-4 py-2 bg-white text-black rounded">Save Notes</button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
