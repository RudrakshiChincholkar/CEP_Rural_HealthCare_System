import { NextResponse } from "next/server"
import { HEALTH_CENTERS } from "@/lib/mock-healthcare"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get("type") || "all").toLowerCase()
  const city = (searchParams.get("city") || "Mumbai").toLowerCase()

  const cityFiltered = HEALTH_CENTERS.filter((center) => center.city.toLowerCase().includes(city))
  const byCity = cityFiltered.length > 0 ? cityFiltered : HEALTH_CENTERS
  const filtered = type === "all" ? byCity : byCity.filter((center) => center.type === type)

  return NextResponse.json({
    city: city.charAt(0).toUpperCase() + city.slice(1),
    results: filtered,
  })
}
