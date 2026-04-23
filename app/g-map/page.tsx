"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

type HealthCenter = {
  name: string
  address: string
  city: string
  type: "public" | "private" | "clinic" | "medical"
  contact: string
  distanceKm: number
  latitude: number
  longitude: number
}

export default function GMap() {
  const [city, setCity] = useState("Mumbai")
  const [places, setPlaces] = useState<HealthCenter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNearbyPlaces(city, selectedFacility)
  }, [city, selectedFacility])

  const fetchNearbyPlaces = async (cityName: string, facilityType: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/health-centers?city=${encodeURIComponent(cityName)}&type=${facilityType}`)
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`)
      }
      const data = await response.json()
      setPlaces(data.results || [])
    } catch (error) {
      setError("Unable to load nearby facilities. Please try again.")
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-gray-1000 text-white min-h-screen">
      <Navbar className="fixed top-0 left-0 w-full bg-black shadow-md z-50" />

      <h1 className="text-3xl font-bold mb-6 pt-20 text-white text-center">Accessible Healthcare Locations</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4 w-full max-w-5xl flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="p-2 border border-gray-700 rounded-lg bg-black text-white"
          value={city}
          placeholder="Enter city (default Mumbai)"
          onChange={(e) => setCity(e.target.value || "Mumbai")}
        />
        <label htmlFor="facility-type" className="mr-2 text-white">
          Select Facility Type:
        </label>
        <select
          id="facility-type"
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          className="p-2 border border-gray-700 rounded-lg bg-black text-white"
        >
          <option value="all">All Medical Facilities</option>
          <option value="public">Public Health Center/Govt Hospitals</option>
          <option value="private">Private Health Centers</option>
          <option value="clinic">Doctor's Clinic</option>
          <option value="medical">Medical Facilities</option>
        </select>
      </div>

      <div className="w-full max-w-5xl mt-4">
        {loading && <p className="text-sm text-gray-300 mb-3">Loading nearby facilities...</p>}
        {!loading && places.length === 0 && <p className="text-sm text-gray-300 mb-3">No facilities found for this city.</p>}
        <div className="w-full h-[350px] sm:h-[450px] md:h-[550px] overflow-y-auto custom-scrollbar">
          <ul className="space-y-3 sm:space-y-4 p-2 sm:p-4">
            {places.map((place, index) => (
              <li
                key={index}
                className="border border-gray-700 p-3 sm:p-5 rounded-lg bg-black shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex flex-col">
                  <strong className="text-base sm:text-lg md:text-xl font-semibold text-blue-400">{place.name}</strong>
                  <p className="text-sm sm:text-base md:text-lg italic text-gray-300">{place.address}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{place.distanceKm.toFixed(1)} km away</p>
                  <p className="text-xs sm:text-sm text-gray-400">Contact: {place.contact}</p>

                  <a
                    href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=14/${place.latitude}/${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-2 text-xs sm:text-sm"
                  >
                    Open in External Maps
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Footer className="w-full bg-black text-gray-400 mt-10" />

      <style jsx>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f1f1f;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}

