"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function MentalHealthPage() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [severe, setSevere] = useState(false)

  const submit = async () => {
    const res = await fetch("/api/mental-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    setResponse(data.response || "")
    setSevere(Boolean(data.severe))
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Mental Health Support Bot</h1>
        <textarea
          className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded"
          placeholder="Share how you are feeling..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={submit} className="mt-3 px-4 py-2 bg-white text-black rounded">Get Support</button>
        {response && <p className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded">{response}</p>}
        {severe && <p className="mt-2 text-red-400 font-semibold">Emergency helpline: Tele-MANAS 14416</p>}
      </main>
      <Footer />
    </div>
  )
}
