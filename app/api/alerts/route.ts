import { NextResponse } from "next/server"
import outbreaks from "@/data/outbreak-alerts.json"

const disasterAlerts = [
  { city: "Mumbai", type: "Flood Warning", level: "MEDIUM", note: "Heavy rainfall expected in low-lying areas." },
  { city: "Mumbai", type: "Heatwave", level: "LOW", note: "Hydration advisory issued for afternoon hours." },
  { city: "Mumbai", type: "Cyclone Alert", level: "LOW", note: "Monitor IMD updates over next 48 hours." },
]

const schemes = [
  { name: "Ayushman Bharat", details: "Health coverage support for eligible families." },
  { name: "Janani Suraksha Yojana", details: "Maternal care support for institutional delivery." },
  { name: "PMJAY", details: "Cashless treatment access at empanelled hospitals." },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area = searchParams.get("area")
  const outbreakData = area
    ? outbreaks.filter((item) => item.area.toLowerCase() === area.toLowerCase())
    : outbreaks

  return NextResponse.json({
    outbreaks: outbreakData,
    disasters: disasterAlerts,
    schemes,
  })
}
