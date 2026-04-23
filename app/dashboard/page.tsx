"use client"

import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const cards = [
  { href: "/triage", title: "AI Triage", desc: "Area-aware symptom screening with urgency assessment." },
  { href: "/nearby-care", title: "Nearby Care", desc: "Mumbai hospitals, clinics, pharmacies, NGOs, and volunteers." },
  { href: "/mental-health", title: "Mental Health Bot", desc: "Supportive emotional wellness assistant with safeguards." },
  { href: "/alerts", title: "Alerts & Schemes", desc: "Outbreak, disaster, vaccination, and scheme notifications." },
  { href: "/telemedicine", title: "Telemedicine", desc: "Book dummy online consultations and video placeholders." },
  { href: "/history", title: "Patient History", desc: "Track symptoms, assessments, doctor visits, and notes." },
  { href: "/leaderboard", title: "Community", desc: "Gamification points and rural health leaderboard." },
  { href: "/profile", title: "Profile", desc: "Personal details, BMI helper, and reminder settings." },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-2">Smart Rural Healthcare Dashboard</h1>
        <p className="text-gray-300 mb-6">Use these modules for triage, preventive care, and healthcare access support.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-lg border border-gray-700 p-4 bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-xl font-semibold text-blue-300">{card.title}</h2>
              <p className="text-sm text-gray-300 mt-2">{card.desc}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
