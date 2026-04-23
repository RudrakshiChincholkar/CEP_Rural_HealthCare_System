"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function TelemedicinePage() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState("")

  useEffect(() => {
    fetch("/api/telemedicine")
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || []))
  }, [])

  const book = () => {
    if (!selectedDoctor) return
    alert(`Consultation booked with ${selectedDoctor}. This is a demo placeholder.`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Telemedicine</h1>
        <div className="grid md:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="p-4 bg-gray-900 border border-gray-700 rounded">
              <h2 className="text-lg text-blue-300">{doctor.name}</h2>
              <p>{doctor.specialization}</p>
              <p className="text-sm text-gray-300">Slot: {doctor.slot}</p>
              <p className="text-sm text-gray-300">Fee: {doctor.fee}</p>
              <button className="mt-2 px-3 py-2 bg-white text-black rounded" onClick={() => setSelectedDoctor(doctor.name)}>
                Select Doctor
              </button>
            </div>
          ))}
        </div>
        <button onClick={book} className="mt-5 px-4 py-2 bg-blue-700 rounded">Book Online Consult</button>

        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded">
          <h2 className="text-xl font-semibold">Video Consult Room (Placeholder)</h2>
          <div className="mt-3 h-48 rounded bg-gray-800 border border-gray-700 flex items-center justify-center">
            <p className="text-gray-400">Video consultation UI placeholder</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
