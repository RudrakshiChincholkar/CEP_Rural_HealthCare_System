import { NextResponse } from "next/server"
import { DOCTORS } from "@/lib/mock-healthcare"

const specialtyMap: Array<{ keywords: string[]; specialization: string }> = [
  { keywords: ["ear", "hearing", "throat", "sinus"], specialization: "ENT Specialist" },
  { keywords: ["skin", "rash", "itch", "acne"], specialization: "Dermatologist" },
  { keywords: ["stress", "anxiety", "depression", "panic"], specialization: "Psychologist" },
  { keywords: ["chest pain", "heart", "palpitation"], specialization: "Cardiologist" },
  { keywords: ["cough", "breathing", "asthma", "lung"], specialization: "Pulmonologist" },
]

export async function POST(request: Request) {
  try {
    const { condition, location } = await request.json()
    const requestedCity = (location || "Mumbai").trim().toLowerCase()
    const requestedCondition = (condition || "").trim().toLowerCase()
    const mappedSpecialty = specialtyMap.find((item) =>
      item.keywords.some((keyword) => requestedCondition.includes(keyword)),
    )?.specialization

    const cityFiltered = DOCTORS.filter((doctor) => doctor.city.toLowerCase().includes(requestedCity))
    const pool = cityFiltered.length > 0 ? cityFiltered : DOCTORS

    // Rank doctors by condition-to-specialist mapping + text match + rating.
    const scoredDoctors = pool.map((doctor) => {
      let score = 0
      if (mappedSpecialty && doctor.specialization.toLowerCase() === mappedSpecialty.toLowerCase()) score += 5
      if (doctor.specialization.toLowerCase().includes(requestedCondition)) score += 3
      if (doctor.hospital.toLowerCase().includes(requestedCondition)) score += 1
      score += doctor.rating
      return { doctor, score }
    })
    const doctors = scoredDoctors.sort((a, b) => b.score - a.score).map((item) => item.doctor)

    return NextResponse.json({
      doctors: doctors.length > 0 ? doctors : pool,
      matchedSpecialty: mappedSpecialty,
      message:
        mappedSpecialty && requestedCondition
          ? `Matched symptoms to ${mappedSpecialty}. Showing most relevant doctors first.`
          : doctors.length === 0
            ? "No exact matches found. Showing closest available doctors."
            : undefined,
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
