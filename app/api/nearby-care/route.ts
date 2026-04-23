import { NextResponse } from "next/server"
import centers from "@/data/mumbai-healthcare.json"

type SortBy = "nearest" | "cheapest" | "best-rated"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const area = searchParams.get("area")
  const sortBy = (searchParams.get("sortBy") as SortBy) || "nearest"

  let results = centers
  if (type) results = results.filter((item) => item.type.toLowerCase() === type.toLowerCase())
  if (area) results = results.filter((item) => item.area.toLowerCase() === area.toLowerCase())

  // Sort options mirror the UI filter chips for predictable behavior.
  if (sortBy === "nearest") results = [...results].sort((a, b) => a.distance_km - b.distance_km)
  if (sortBy === "cheapest") results = [...results].sort((a, b) => a.estimated_cost - b.estimated_cost)
  if (sortBy === "best-rated") results = [...results].sort((a, b) => b.rating - a.rating)

  return NextResponse.json({ results })
}
