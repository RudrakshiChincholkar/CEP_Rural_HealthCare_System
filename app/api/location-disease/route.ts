import { NextResponse } from "next/server"
import regionDiseases from "@/data/region-diseases.json"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area = (searchParams.get("area") || "").toLowerCase().trim()
  if (!area) {
    return NextResponse.json({ error: "Area is required" }, { status: 400 })
  }

  const match = regionDiseases.find((item) => item.region === area)
  if (!match) {
    return NextResponse.json({
      region: area,
      commonDiseases: ["viral fever", "general seasonal infection"],
      preventionTips: ["maintain hydration", "observe hygiene", "consult PHC for persistent symptoms"],
    })
  }

  return NextResponse.json(match)
}

