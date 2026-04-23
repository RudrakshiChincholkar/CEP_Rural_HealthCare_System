"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function AlertsPage() {
  const [area, setArea] = useState("Kurla")
  const [data, setData] = useState<any>({ outbreaks: [], disasters: [], schemes: [] })
  const [vaccinationDate, setVaccinationDate] = useState("")

  useEffect(() => {
    fetch(`/api/alerts?area=${encodeURIComponent(area)}`)
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [area])

  const saveReminder = () => {
    localStorage.setItem("vaccination-reminder", vaccinationDate)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Outbreak, Disaster & Scheme Alerts</h1>
        <input className="p-2 bg-gray-900 border border-gray-700 rounded" value={area} onChange={(e) => setArea(e.target.value)} />

        <section className="mt-5">
          <h2 className="text-xl font-semibold mb-2">Outbreak Alerts</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {data.outbreaks?.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-900 border border-gray-700 rounded">
                <p><strong>{item.area}</strong> - {item.disease} ({item.risk})</p>
                <p className="text-sm text-gray-300">{item.reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-xl font-semibold mb-2">Disaster Alerts</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {data.disasters?.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-900 border border-gray-700 rounded">
                <p><strong>{item.type}</strong> ({item.level})</p>
                <p className="text-sm text-gray-300">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-xl font-semibold mb-2">Government Scheme Notifications</h2>
          {data.schemes?.map((item: any, idx: number) => (
            <div key={idx} className="p-3 bg-gray-900 border border-gray-700 rounded mb-2">
              <p><strong>{item.name}</strong></p>
              <p className="text-sm text-gray-300">{item.details}</p>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <h2 className="text-xl font-semibold mb-2">Vaccination Reminder</h2>
          <input type="date" className="p-2 bg-gray-900 border border-gray-700 rounded" value={vaccinationDate} onChange={(e) => setVaccinationDate(e.target.value)} />
          <button onClick={saveReminder} className="ml-3 px-4 py-2 bg-white text-black rounded">Save Reminder</button>
        </section>
      </main>
      <Footer />
    </div>
  )
}
