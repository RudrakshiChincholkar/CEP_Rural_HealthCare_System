import { NextResponse } from "next/server"
import { getAIService } from "@/lib/ai-service"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 })

    const aiService = getAIService()
    const result = await aiService.mentalHealthResponse({ message })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to process message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
