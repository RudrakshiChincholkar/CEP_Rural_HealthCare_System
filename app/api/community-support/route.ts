import { NextResponse } from "next/server"
import communitySupport from "@/data/community-support.json"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area = (searchParams.get("area") || "").toLowerCase().trim()
  if (!area) {
    return NextResponse.json(communitySupport)
  }

  const ngos = communitySupport.ngos.filter((item) => item.area.toLowerCase() === area)
  const volunteers = communitySupport.volunteers.filter((item) => item.area.toLowerCase() === area)
  return NextResponse.json({ ngos, volunteers })
}

