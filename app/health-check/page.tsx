"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const translations = [
  { lang: "English", heading: "Health Check", placeholder: "Describe your symptoms..." },
  { lang: "हिन्दी", heading: "स्वास्थ्य जाँच", placeholder: "अपने लक्षणों का वर्णन करें..." },
  { lang: "ગુજરાતી", heading: "આરોગ્ય ચકાસણી", placeholder: "તમારા લક્ષણો વર્ણવો..." },
  { lang: "বাংলা", heading: "স্বাস্থ্য পরীক্ষা", placeholder: "আপনার উপসর্গ বর্ণনা করুন..." },
  { lang: "मराठी", heading: "आरोग्य तपासणी", placeholder: "तुमच्या लक्षणांचे वर्णन करा..." },
  { lang: "தமிழ்", heading: "ஆரோக்கிய சோதனை", placeholder: "உங்கள் அறிகுறிகளை விவரிக்கவும்..." },
]

const loadingMessages = [
  "Processing...",
  "Analyzing symptoms...",
  "Generating advice...",
  "Almost there...",
  "Fetching data...",
]

export default function HealthCheck() {
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")
  const [summary, setSummary] = useState("")
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | null>(null)
  const [followUps, setFollowUps] = useState<string[]>([])
  const [language, setLanguage] = useState<"English" | "Hindi" | "Marathi">("English")
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [medicineReminder, setMedicineReminder] = useState({ medicine: "", time: "" })
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [currentMessage, setCurrentMessage] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const messageRef = useRef(null)

  useEffect(() => {
    // Restore previous chat to provide lightweight context memory across sessions.
    const saved = localStorage.getItem("health-chat-history")
    if (saved) setChatHistory(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % translations.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let interval
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
        setCurrentIndex(0)
        setCurrentMessage("")
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (loading) {
      const message = loadingMessages[loadingMessageIndex]
      const timeout = setTimeout(() => {
        setCurrentMessage(() => {
          if (currentIndex < message.length) {
            return message.substring(0, currentIndex + 1)
          } else {
            return message
          }
        })
        setCurrentIndex((prevIndex) => prevIndex + 1)
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [loading, loadingMessageIndex, currentIndex])

  const handleSubmit = async () => {
    setLoading(true)
    setResponse("")
    setSummary("")
    setUrgency(null)
    setFollowUps([])
    setError(null)

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, language, history: chatHistory.slice(-6) }),
      })

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }

      const data = await res.json()
      setResponse(data.response || "No response available.")
      setSummary(data.summary || "No detailed response available.")
      setUrgency(data.urgency || null)
      setFollowUps(data.followUpQuestions || [])

      const updatedHistory = [
        ...chatHistory,
        { role: "user", content: input },
        { role: "assistant", content: data.response || "" },
      ].slice(-20)
      setChatHistory(updatedHistory)
      localStorage.setItem("health-chat-history", JSON.stringify(updatedHistory))

      const consultHistory = JSON.parse(localStorage.getItem("patient-history") || "[]")
      consultHistory.unshift({
        createdAt: new Date().toISOString(),
        symptoms: input,
        explanation: data.response || "",
        urgency: data.urgency || "MEDIUM",
      })
      localStorage.setItem("patient-history", JSON.stringify(consultHistory.slice(0, 50)))
    } catch (error) {
      setError("Unable to fetch AI advice right now. Please try again.")
    }

    setLoading(false)
  }

  const saveReminder = () => {
    const current = JSON.parse(localStorage.getItem("medicine-reminders") || "[]")
    current.push(medicineReminder)
    localStorage.setItem("medicine-reminders", JSON.stringify(current))
    setMedicineReminder({ medicine: "", time: "" })
  }

  const downloadSummary = () => {
    const blob = new Blob(
      [
        `Symptoms: ${input}\n\nUrgency: ${urgency || "N/A"}\n\nAI Advice:\n${response}\n\nSummary:\n${summary}\n\nGenerated: ${new Date().toLocaleString()}`,
      ],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "consultation-summary.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="relative z-10">
        <Navbar />
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto bg-dark shadow-lg rounded-lg p-4 sm:p-6 md:p-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6">
              {translations[index].heading}
            </h1>
            <div className="mb-3">
              <label className="text-sm mr-2">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "English" | "Hindi" | "Marathi")}
                className="bg-black border border-gray-700 rounded px-2 py-1 text-sm"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
              </select>
            </div>

            <textarea
              className="w-full h-24 sm:h-32 md:h-48 p-3 sm:p-4 border border-gray-300 rounded-lg text-xs sm:text-sm md:text-base mb-3 sm:mb-4 bg-black text-white placeholder-white"
              placeholder={translations[index].placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <Button
              className="w-full sm:w-auto mb-4 sm:mb-6 py-2 px-3 sm:px-4 bg-white text-black rounded-lg transition-all hover:bg-[#b9b9b9] text-sm sm:text-base"
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <span ref={messageRef}>{currentMessage}</span> : "Get AI Health Advice"}
            </Button>

            {loading && (
              <div className="flex justify-center items-center space-x-2 my-3 sm:my-4">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            {(response || summary) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="p-4 sm:p-6 bg-dark text-white rounded-lg w-full max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold pb-3 sm:pb-5">
                    <strong>AI Response</strong>
                  </h2>
                  {urgency && (
                    <span
                      className={`inline-block mb-3 px-2 py-1 rounded text-xs ${
                        urgency === "HIGH"
                          ? "bg-red-900 text-red-200"
                          : urgency === "MEDIUM"
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-green-900 text-green-200"
                      }`}
                    >
                      Urgency: {urgency}
                    </span>
                  )}
                  <div className="space-y-2">
                    {response.split("\n").map((item, index) => (
                      <p
                        key={index}
                        className="text-xs sm:text-sm md:text-base before:content-['•'] before:mr-2 before:text-white-400"
                      >
                        {item.trim()}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-dark text-white rounded-lg w-full max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold pb-3 sm:pb-5">
                    <strong>Detailed Response</strong>
                  </h2>
                  <div className="text-xs sm:text-sm md:text-base whitespace-pre-wrap">{summary}</div>
                  {followUps.length > 0 && (
                    <div className="mt-3">
                      <h3 className="font-semibold text-sm mb-1">Follow-up Questions</h3>
                      {followUps.map((q, i) => (
                        <p key={i} className="text-xs sm:text-sm">- {q}</p>
                      ))}
                    </div>
                  )}
                  <Button
                    className="mt-3 py-1 px-3 bg-white text-black text-xs"
                    size="sm"
                    onClick={downloadSummary}
                  >
                    Download Consultation Summary
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 border border-gray-700 rounded p-3">
              <h3 className="font-semibold text-sm mb-2">Medicine Reminder</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-sm"
                  placeholder="Medicine name"
                  value={medicineReminder.medicine}
                  onChange={(e) => setMedicineReminder((prev) => ({ ...prev, medicine: e.target.value }))}
                />
                <input
                  type="time"
                  className="bg-black border border-gray-700 rounded px-2 py-1 text-sm"
                  value={medicineReminder.time}
                  onChange={(e) => setMedicineReminder((prev) => ({ ...prev, time: e.target.value }))}
                />
                <Button size="sm" className="bg-white text-black" onClick={saveReminder}>
                  Save Reminder
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-3 sm:space-y-0 mt-4 sm:mt-6">
              <Button
                className="w-full sm:w-auto py-2 px-3 sm:px-4 bg-white text-black rounded-lg transition-all hover:bg-[#b9b9b9] text-sm sm:text-base"
                size="lg"
                onClick={() => router.push("/find-doctor")}
              >
                Find Doctors?
              </Button>
              <Button
                className="w-full sm:w-auto py-2 px-3 sm:px-4 bg-white text-black rounded-lg transition-all hover:bg-[#b9b9b9] text-sm sm:text-base"
                size="lg"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}

