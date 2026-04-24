"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { speakText } from "@/lib/accessibility-hooks"

function localMentalSupportRule(message: string) {
  const text = message.toLowerCase()
  const severe = ["suicide", "self harm", "end my life", "kill myself"].some((term) => text.includes(term))
  if (severe) {
    return {
      severe: true,
      response: "I am concerned about your safety. Please contact emergency support now. Reach Tele-MANAS 14416 and call 108 for urgent danger.",
    }
  }
  return {
    severe: false,
    response:
      "Thank you for sharing this. Try deep breathing for 2 minutes, drink water, and speak to a trusted person. If this continues, consult a mental health professional.",
  }
}

export default function MentalHealthPage() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState("")
  const [severe, setSevere] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mental-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to get support response")
      setResponse(data.response || "")
      setSevere(Boolean(data.severe))
    } catch (e: any) {
      const fallback = localMentalSupportRule(message)
      setResponse(fallback.response)
      setSevere(fallback.severe)
      setError(e.message || "Live service unavailable. Local support flow is active.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Mental Health Support Bot</h1>
        <p className="text-yellow-300 text-sm mb-4">This system provides guidance, not medical diagnosis.</p>
        <textarea
          className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded"
          placeholder="Share how you are feeling..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={submit} className="mt-3 px-4 py-2 bg-white text-black rounded" disabled={loading || !message.trim()}>
          {loading ? "Thinking..." : "Get Support"}
        </button>
        {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        {response && <p className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded">{response}</p>}
        {response && <button onClick={() => speakText(response)} className="mt-3 px-4 py-2 bg-blue-700 rounded">Read Guidance Aloud</button>}
        {severe && <p className="mt-2 text-red-400 font-semibold">Emergency helpline: Tele-MANAS 14416</p>}
      </main>
      <Footer />
    </div>
  )
}
