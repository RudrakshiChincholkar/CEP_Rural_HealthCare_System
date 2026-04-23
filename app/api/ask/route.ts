import { NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: Request) {
  try {
    const { question, area, language, history } = await request.json()
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const aiService = getAIService()
    const answer = await aiService.askHealthQuestion({ question, area, language, history })
    const summary = await aiService.summarizeHistory({ entries: [question, answer.response] })
    return NextResponse.json({
      response: answer.response,
      summary,
      urgency: answer.urgency,
      followUpQuestions: answer.followUpQuestions,
      extracted: answer.extracted,
      usedFallback: answer.usedFallback,
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
