"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

type Doctor = {
  name: string
  specialization: string
  hospital: string
  city: string
  contact: string
  experience: string
  consultationFee: number
  distanceKm: number
  rating: number
  languages: string[]
  availability: string
  aboutUrl: string
}

export default function FindDoctor() {
  const [condition, setCondition] = useState("")
  const [location, setLocation] = useState("Mumbai")
  const [apiResponse, setApiResponse] = useState<{ doctors: Doctor[]; message?: string; matchedSpecialty?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFindDoctors = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, location }),
      })

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }

      const data = await res.json()
      setApiResponse(data)
    } catch (error) {
      setApiResponse(null)
      setError("Unable to fetch doctors right now. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-black dark:bg-black text-white text-white">
      <Navbar />

      {/* Search Section - Fixed at Top */}
      <div className="bg-black dark:bg-black text-white py-6 sm:py-8 px-3 sm:px-4 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">Find Nearby Doctors</h1>

          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch">
            <div className="flex-1">
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-black dark:bg-black text-white placeholder-gray-400 border border-gray-700 text-sm sm:text-base"
                placeholder="Enter your health condition..."
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </div>

            <div className="flex-1">
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-black dark:bg-black text-white placeholder-gray-400 border border-gray-700 text-sm sm:text-base"
                placeholder="Enter your location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button
              className="flex items-center justify-center gap-2 hover:bg-[#b9b9b9] text-sm sm:text-base py-2 sm:py-3"
              onClick={handleFindDoctors}
              disabled={loading}
            >
              <Search size={16} className="sm:size-20" />
              {loading ? "Searching..." : "Find Doctors"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section - Expanded Area Below */}
      <div className="flex-grow dark:bg-black text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="dark:bg-black text-white shadow-md p-8 text-center border border-red-800 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          ) : apiResponse && apiResponse.doctors ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-white pb-2 border-b border-gray-700">Doctors Found</h2>
              {apiResponse.matchedSpecialty && (
                <p className="mb-3 text-sm text-green-300">Best specialty for your symptoms: {apiResponse.matchedSpecialty}</p>
              )}
              {apiResponse.message && <p className="mb-4 text-sm text-yellow-400">{apiResponse.message}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {apiResponse.doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 flex flex-col border border-gray-700"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-2">{doctor.name}</h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="inline-block bg-blue-900 text-blue-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        {doctor.specialization}
                      </span>
                    </div>

                    <div className="space-y-2 sm:space-y-3 text-gray-300 flex-grow text-sm sm:text-base">
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Hospital:</span>
                        <span>{doctor.hospital}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Experience:</span>
                        <span>{doctor.experience}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Fee:</span>
                        <span>INR {doctor.consultationFee}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Distance:</span>
                        <span>{doctor.distanceKm} km</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Rating:</span>
                        <span>{doctor.rating} / 5</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Languages:</span>
                        <span>{doctor.languages.join(", ")}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Availability:</span>
                        <span>{doctor.availability}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">City:</span>
                        <span>{doctor.city}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-medium min-w-16 sm:min-w-24 inline-block">Contact:</span>
                        <span>{doctor.contact}</span>
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                      <Link
                        href={doctor.aboutUrl}
                        target="_blank"
                        className="text-blue-400 hover:text-blue-300 font-medium text-xs sm:text-sm inline-flex items-center"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dark:bg-black text-white shadow-md p-8 text-center border border-gray-700 rounded-lg">
              <div className="flex flex-col items-center justify-center py-12">
                <Search size={48} className="text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">
                  Enter your health condition and location to find doctors near you
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Home Button */}
      <div className="dark:bg-black text-white pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 hover:bg-[#b9b9b9]"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

