"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import modules from "@/data/training-modules.json"
import { speakText } from "@/lib/accessibility-hooks"

export default function TrainingPage() {
  const [completedIds, setCompletedIds] = useState<string[]>([])

  useEffect(() => {
    setCompletedIds(JSON.parse(localStorage.getItem("training-completed") || "[]"))
  }, [])

  const markComplete = (id: string) => {
    const next = Array.from(new Set([...completedIds, id]))
    setCompletedIds(next)
    localStorage.setItem("training-completed", JSON.stringify(next))
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-4">Local Health Training Modules</h1>
        <p className="text-yellow-300 text-sm mb-4">This system provides guidance, not medical diagnosis.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map((module) => (
            <div key={module.id} className="p-4 rounded border border-gray-700 bg-gray-900">
              <h2 className="text-xl font-semibold text-blue-300">{module.title}</h2>
              <p className="text-sm text-gray-300 mt-1">Level: {module.level} | Duration: {module.duration}</p>
              <p className="mt-3">{module.content}</p>
              <div className="mt-3">
                <button onClick={() => speakText(module.content)} className="px-4 py-2 bg-blue-700 rounded mr-2">Voice Guidance</button>
                <button onClick={() => markComplete(module.id)} className="px-4 py-2 bg-white text-black rounded">
                  {completedIds.includes(module.id) ? "Completed" : "Mark Complete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

