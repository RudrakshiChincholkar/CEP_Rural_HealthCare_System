"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const users = [
  { name: "Asha Patil", points: 780 },
  { name: "Ravi More", points: 720 },
  { name: "Neha Singh", points: 680 },
  { name: "Irfan Shaikh", points: 640 },
  { name: "Meera Joshi", points: 610 },
]

const rules = [
  "Complete profile: +50",
  "Daily health check: +20",
  "Vaccination update: +40",
  "Read awareness article: +15",
  "Training completion: +30",
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Community Gamification Leaderboard</h1>
        <div className="p-4 bg-gray-900 border border-gray-700 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">How to earn points</h2>
          {rules.map((rule) => <p key={rule} className="text-sm text-gray-300">{rule}</p>)}
        </div>
        <div className="space-y-2">
          {users.map((user, idx) => (
            <div key={user.name} className="p-3 bg-gray-900 border border-gray-700 rounded flex justify-between">
              <span>{idx + 1}. {user.name}</span>
              <span>{user.points} pts</span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
