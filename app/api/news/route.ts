import { NextResponse } from "next/server"
import { HEALTH_NEWS } from "@/lib/mock-healthcare"

export async function POST(request: Request) {
  try {
    const { language } = await request.json()

    return NextResponse.json({
      language: language || "English",
      news: HEALTH_NEWS,
    })
  } catch (error) {
    return NextResponse.json(
      {
        news: [],
        error: "Unable to fetch health news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
