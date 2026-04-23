"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react" // Icons for dropdown

const translations = [
  { lang: "English", text: "GramAarogya" },
  { lang: "हिन्दी", text: "ग्रामआरोग्य" },
  { lang: "ગુજરાતી", text: "ગ્રામઆરોગ્ય" },
  { lang: "বাংলা", text: "গ্রামআরোগ্য" },
  { lang: "मराठी", text: "ग्रामआरोग्य" },
  { lang: "தமிழ்", text: "கிராமாரோக்கிய" },
]

const greetings = [
  { lang: "English", text: "Hello" },
  { lang: "हिन्दी", text: "नमस्ते" },
  { lang: "ગુજરાતી", text: "નમસ્તે" },
  { lang: "বাংলা", text: "নমস্কার" },
  { lang: "मराठी", text: "नमस्कार" },
  { lang: "தமிழ்", text: "வணக்கம்" },
]

export default function Navbar() {
  const [indexLeft, setIndexLeft] = useState(0)
  const [indexRight, setIndexRight] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false) // Controls dropdown expansion

  useEffect(() => {
    const intervalLeft = setInterval(() => {
      setIndexLeft((prevIndex) => (prevIndex + 1) % translations.length)
    }, 3000)

    const intervalRight = setInterval(() => {
      setIndexRight((prevIndex) => (prevIndex + 1) % greetings.length)
    }, 3000)

    return () => {
      clearInterval(intervalLeft)
      clearInterval(intervalRight)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Animated GramAarogya */}
        <div className="flex items-center space-x-2">
          <Link href="/hero" className="mr-6 flex items-center">
            <span className="text-xl font-bold italic transition-all duration-1000 sm:text-2xl lg:text-3xl">
              {translations[indexLeft].text}
            </span>
          </Link>
        </div>

        {/* Desktop Navbar Links */}
        <nav className="hidden sm:flex flex-1 items-center justify-center space-x-4 sm:space-x-6 text-sm font-medium">
          <Link href="/dashboard" className="transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link href="/health-check" className="transition-colors hover:text-primary">
            AarogyaMitraAI
          </Link>
          <Link href="/find-doctor" className="transition-colors hover:text-primary">
            AarogyaConnect
          </Link>
          <Link href="/g-map" className="transition-colors hover:text-primary">
            AarogyaMap
          </Link>
          <Link href="/news-help" className="transition-colors hover:text-primary">
            AarogyaPulse
          </Link>
          <Link href="/health-insights" className="transition-colors hover:text-primary">
            AarogyaView
          </Link>
          <Link href="/our-team" className="transition-colors hover:text-primary">
            AarogyaParivar
          </Link>
          <Link href="/triage" className="transition-colors hover:text-primary">
            Triage
          </Link>
          <Link href="/nearby-care" className="transition-colors hover:text-primary">
            Nearby Care
          </Link>
          <Link href="/alerts" className="transition-colors hover:text-primary">
            Alerts
          </Link>
          <Link href="/mental-health" className="transition-colors hover:text-primary">
            Mental Health
          </Link>
          <Link href="/history" className="transition-colors hover:text-primary">
            History
          </Link>
          <Link href="/profile" className="transition-colors hover:text-primary">
            Profile
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-primary">
            Leaderboard
          </Link>
          <Link href="/telemedicine" className="transition-colors hover:text-primary">
            Telemedicine
          </Link>
        </nav>

        {/* Mobile Dropdown (Single Visible Option) */}
        <div className="relative sm:hidden flex flex-1 justify-center">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-base md:text-lg font-medium flex items-center space-x-2 border rounded-lg px-3 py-1.5 md:px-4 md:py-2 bg-dark text-white"
            aria-expanded={dropdownOpen}
            aria-controls="mobile-menu"
          >
            <span>Menu</span>
            {dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {dropdownOpen && (
            <div
              id="mobile-menu"
              className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[90%] bg-gray-900 shadow-lg rounded-lg text-center py-3 border border-gray-700 z-50"
            >
              <Link
                href="/dashboard"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/health-check"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaMitraAI
              </Link>
              <Link
                href="/find-doctor"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaConnect
              </Link>
              <Link
                href="/g-map"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaMap
              </Link>
              <Link
                href="/news-help"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaPulse
              </Link>
              <Link
                href="/health-insights"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaView
              </Link>
              <Link
                href="/our-team"
                className="block py-2 text-base font-medium hover:text-primary transition"
                onClick={() => setDropdownOpen(false)}
              >
                AarogyaParivar
              </Link>
              <Link href="/triage" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Triage
              </Link>
              <Link href="/nearby-care" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Nearby Care
              </Link>
              <Link href="/alerts" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Alerts
              </Link>
              <Link href="/mental-health" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Mental Health
              </Link>
              <Link href="/history" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                History
              </Link>
              <Link href="/profile" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Profile
              </Link>
              <Link href="/leaderboard" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Leaderboard
              </Link>
              <Link href="/telemedicine" className="block py-2 text-base font-medium hover:text-primary transition" onClick={() => setDropdownOpen(false)}>
                Telemedicine
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Animated Hello (Now Visible on Mobile Too) */}
        <div className="flex items-center space-x-4">
          <span className="text-lg font-bold italic transition-all duration-1000 sm:text-xl lg:text-2xl">
            {greetings[indexRight].text}
          </span>
        </div>
      </div>
    </header>
  )
}

