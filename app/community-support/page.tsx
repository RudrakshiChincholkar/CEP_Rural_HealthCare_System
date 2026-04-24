"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

type CommunityData = {
  ngos: Array<{ name: string; area: string; services: string[]; contact: string }>
  volunteers: Array<{ name: string; area: string; role: string; contact: string }>
}

export default function CommunitySupportPage() {
  const [area, setArea] = useState("Kurla")
  const [data, setData] = useState<CommunityData>({ ngos: [], volunteers: [] })

  useEffect(() => {
    fetch(`/api/community-support?area=${encodeURIComponent(area)}`)
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [area])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">NGO & Volunteer Support</h1>
        <p className="text-yellow-300 text-sm mb-4">This system provides guidance, not medical diagnosis.</p>
        <input className="p-3 bg-gray-900 border border-gray-700 rounded w-full md:w-72 text-lg" value={area} onChange={(e) => setArea(e.target.value)} />

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">NGOs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.ngos.map((ngo) => (
              <div key={ngo.name} className="p-4 rounded border border-gray-700 bg-gray-900">
                <p className="font-semibold">{ngo.name}</p>
                <p className="text-sm text-gray-300">{ngo.area}</p>
                <p className="text-sm mt-2">Services: {ngo.services.join(", ")}</p>
                <p className="text-sm">Contact: {ngo.contact}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">Volunteers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.volunteers.map((volunteer) => (
              <div key={volunteer.name} className="p-4 rounded border border-gray-700 bg-gray-900">
                <p className="font-semibold">{volunteer.name}</p>
                <p className="text-sm text-gray-300">{volunteer.area}</p>
                <p className="text-sm mt-2">Role: {volunteer.role}</p>
                <p className="text-sm">Contact: {volunteer.contact}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

