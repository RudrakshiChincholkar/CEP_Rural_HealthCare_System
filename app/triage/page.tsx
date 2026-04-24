"use client"

import { useMemo, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { uiLabels, type Lang } from "@/lib/i18n-health"
import { addPatientHistory, addSOSEvent } from "@/lib/offline-health"
import { speakText, startVoiceInput } from "@/lib/accessibility-hooks"

export default function TriagePage() {
  const [lang, setLang] = useState<Lang>("en")
  const [area, setArea] = useState("Kurla")
  const [symptoms, setSymptoms] = useState("")
  const [history, setHistory] = useState("")
  const [age, setAge] = useState("")
  const [bmi, setBmi] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [regionalDiseaseData, setRegionalDiseaseData] = useState<{ commonDiseases: string[]; preventionTips: string[] } | null>(null)
  const [sosStatus, setSosStatus] = useState("")

  const labels = useMemo(() => uiLabels[lang], [lang])

  const startVoice = () => {
    startVoiceInput(
      (transcript) => setSymptoms((prev) => `${prev} ${transcript}`.trim()),
      lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN",
      () => setError("Speech recognition not supported in this browser."),
    )
  }

  const speakAnswer = () => {
    if (!result?.explanation) return
    speakText(`${result.explanation} ${result.disclaimer}`, lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN")
  }

  const triggerSOS = async () => {
    try {
      const reason = result?.emergencyWarning ? result.emergencyWarning : `Emergency request with symptoms: ${symptoms}`
      const payload = { area, contact: "108", reason }
      addSOSEvent(payload)
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setSosStatus(data.message || "SOS triggered")
    } catch {
      setSosStatus("SOS saved offline. Please call 108 immediately.")
    }
  }

  const submit = async () => {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          symptoms,
          history,
          age: age ? Number(age) : undefined,
          bmi: bmi ? Number(bmi) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Triage failed")
      setResult(data)
      const diseaseRes = await fetch(`/api/location-disease?area=${encodeURIComponent(area)}`)
      const diseaseData = await diseaseRes.json()
      setRegionalDiseaseData(diseaseData)

      // Persist triage report for offline-first history management.
      addPatientHistory({
        symptoms,
        urgency: data.urgency,
        explanation: data.explanation,
      })
    } catch (e: any) {
      setError(e.message || "Unable to process request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">AI Health Screening & Triage</h1>
        <p className="text-yellow-300 text-sm mb-4">This system provides guidance, not medical diagnosis.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{labels.language}</label>
            <select className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <div>
            <label className="text-sm">{labels.area}</label>
            <input className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm">{labels.symptoms}</label>
          <textarea className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded h-28" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          <button onClick={startVoice} className="mt-2 px-6 py-4 bg-blue-700 rounded text-lg">Voice Input</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Medical history" value={history} onChange={(e) => setHistory(e.target.value)} />
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
          <input className="p-2 bg-gray-900 border border-gray-700 rounded" placeholder="BMI (optional)" value={bmi} onChange={(e) => setBmi(e.target.value)} />
        </div>

        <button onClick={submit} disabled={loading || !symptoms} className="mt-4 px-8 py-4 bg-white text-black rounded text-lg font-semibold disabled:opacity-60">
          {loading ? labels.loading : labels.submit}
        </button>
        <button onClick={triggerSOS} className="mt-4 ml-3 px-8 py-4 bg-red-700 text-white rounded text-lg font-semibold">One-Click SOS</button>
        {error && <p className="text-red-400 mt-3">{error}</p>}
        {sosStatus && <p className="text-green-400 mt-3">{sosStatus}</p>}

        {result && (
          <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-700 space-y-2">
            <p><strong>Possible Condition:</strong> {result.possibleCondition}</p>
            <p><strong>Urgency:</strong> {result.urgency}</p>
            <p><strong>Explanation:</strong> {result.explanation}</p>
            <p><strong>Home Remedy:</strong> {result.remedy}</p>
            <p><strong>Diet & Lifestyle:</strong> {result.lifestyle}</p>
            <p className="text-yellow-300 text-sm">{result.disclaimer}</p>
            {result.emergencyWarning && <p className="text-red-400 font-semibold">{result.emergencyWarning}</p>}
            <button onClick={speakAnswer} className="px-3 py-2 bg-blue-700 rounded text-sm">Read Answer Aloud</button>
          </div>
        )}
        {regionalDiseaseData && (
          <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-700">
            <p><strong>Likely Local Diseases in {area}:</strong> {regionalDiseaseData.commonDiseases?.join(", ")}</p>
            <p className="mt-2"><strong>Prevention Tips:</strong> {regionalDiseaseData.preventionTips?.join(" | ")}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
