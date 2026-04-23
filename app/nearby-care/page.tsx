"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const types = ["All", "Hospital", "Clinic", "Pharmacy", "NGO", "ASHA/Volunteer"]
const sorts = [
  { id: "nearest", label: "Nearest" },
  { id: "cheapest", label: "Cheapest" },
  { id: "best-rated", label: "Best Rated" },
]

export default function NearbyCarePage() {
  const [area, setArea] = useState("Andheri")
  const [type, setType] = useState("All")
  const [sortBy, setSortBy] = useState("nearest")
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const query = new URLSearchParams({
      area,
      sortBy,
      ...(type !== "All" ? { type } : {}),
    })
    fetch(`/api/nearby-care?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => setItems(data.results || []))
  }, [area, type, sortBy])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Nearby Doctors & Facilities (Mumbai)</h1>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" value={area} onChange={(e) => setArea(e.target.value)} />
          <select className="p-2 bg-gray-900 border border-gray-700 rounded" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="p-2 bg-gray-900 border border-gray-700 rounded" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sorts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {items.map((item) => (
            <div key={item.id} className="p-4 rounded border border-gray-700 bg-gray-900">
              <h2 className="text-lg text-blue-300 font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-300">{item.type} - {item.area}</p>
              <p className="text-sm mt-2">Distance: {item.distance_km} km</p>
              <p className="text-sm">Rating: {item.rating} | Trust: {item.trust_score}</p>
              <p className="text-sm">Estimated Cost: INR {item.estimated_cost}</p>
              <p className="text-sm">Phone: {item.phone}</p>
              <p className="text-sm">Hours: {item.open_hours}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
