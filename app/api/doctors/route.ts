import { NextResponse } from "next/server"
import { DOCTORS } from "@/lib/mock-healthcare"

export async function POST(request: Request) {
  try {
    const { condition, location } = await request.json()
    const requestedCity = (location || "Mumbai").trim().toLowerCase()
    const requestedCondition = (condition || "").trim().toLowerCase()

    const cityFiltered = DOCTORS.filter((doctor) => doctor.city.toLowerCase().includes(requestedCity))
    const pool = cityFiltered.length > 0 ? cityFiltered : DOCTORS

    const doctors = requestedCondition
      ? pool.filter(
          (doctor) =>
            doctor.specialization.toLowerCase().includes(requestedCondition) ||
            doctor.hospital.toLowerCase().includes(requestedCondition),
        )
      : pool

    return NextResponse.json({
      doctors: doctors.length > 0 ? doctors : pool,
      message: doctors.length === 0 ? "No exact matches found. Showing closest available doctors." : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      {
        doctors: [],
        error: "Unable to fetch doctors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
