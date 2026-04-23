"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [bmi, setBmi] = useState<number | null>(null)

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem("patient-profile") || "{}")
    setName(profile.name || "")
    setAge(profile.age || "")
    setHeight(profile.height || "")
    setWeight(profile.weight || "")
  }, [])

  const save = () => {
    const h = Number(height)
    const w = Number(weight)
    const computed = h > 0 ? Number((w / ((h / 100) * (h / 100))).toFixed(1)) : null
    setBmi(computed)
    localStorage.setItem("patient-profile", JSON.stringify({ name, age, height, weight, bmi: computed }))
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Profile</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <button onClick={save} className="mt-4 px-4 py-2 bg-white text-black rounded">Save Profile</button>
        {bmi && <p className="mt-3">BMI: {bmi}</p>}
      </main>
      <Footer />
    </div>
  )
}
