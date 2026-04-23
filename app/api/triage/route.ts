import { NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body?.symptoms || !body?.area) {
      return NextResponse.json({ error: "Area and symptoms are required" }, { status: 400 })
    }

    // Centralized triage logic is handled through the AI service abstraction.
    const aiService = getAIService()
    const triage = await aiService.triageSymptoms({
      area: body.area,
      symptoms: body.symptoms,
      history: body.history,
      age: body.age,
      bmi: body.bmi,
      habits: body.habits,
      diseaseHistory: body.diseaseHistory,
    })

    return NextResponse.json(triage)
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to complete triage", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
