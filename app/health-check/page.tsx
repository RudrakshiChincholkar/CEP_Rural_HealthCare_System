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
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [currentMessage, setCurrentMessage] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const messageRef = useRef(null)

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
    setError(null)

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      })

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }

      const data = await res.json()
      setResponse(data.response || "No response available.")
      setSummary(data.summary || "No detailed response available.")
    } catch (error) {
      setError("Unable to fetch AI advice right now. Please try again.")
    }

    setLoading(false)
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
                </div>
              </div>
            )}

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

