import { NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: Request) {
  try {
    const { question, area } = await request.json()
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const aiService = getAIService()
    const response = await aiService.askHealthQuestion({ question, area })
    return NextResponse.json({
      response,
      summary:
        "This response is supportive and medically cautious. It may indicate possibilities only. Please consult a doctor for diagnosis.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
