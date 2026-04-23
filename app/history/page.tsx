"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function HistoryPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setEntries(JSON.parse(localStorage.getItem("patient-history") || "[]"))
    setNotes(localStorage.getItem("patient-notes") || "")
  }, [])

  const saveNotes = () => {
    // Persist free-form notes for offline-friendly access.
    localStorage.setItem("patient-notes", notes)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Patient History</h1>
        <p className="text-gray-300 mb-4">Includes symptoms, AI assessments, visits, prescriptions, and notes.</p>

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
              </div>
            ))
          )}
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
