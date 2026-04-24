import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body?.area || !body?.contact || !body?.reason) {
      return NextResponse.json({ error: "area, contact, and reason are required" }, { status: 400 })
    }

    // Mock SOS acknowledgment for offline-first implementation with future sync.
    return NextResponse.json({
      status: "triggered",
      message: "SOS request registered. Contact local emergency services immediately.",
      emergencyContact: "108",
      data: body,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to trigger SOS", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

