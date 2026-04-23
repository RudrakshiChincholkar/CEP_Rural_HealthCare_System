import { NextResponse } from "next/server"

const teleDoctors = [
  { id: 1, name: "Dr. Neha Kulkarni", specialization: "General Physician", slot: "Today 6:30 PM", fee: "INR 499" },
  { id: 2, name: "Dr. Rahul Menon", specialization: "Pediatrician", slot: "Tomorrow 10:00 AM", fee: "INR 599" },
  { id: 3, name: "Dr. S. Mehta", specialization: "Dermatologist", slot: "Today 8:00 PM", fee: "INR 699" },
]

export async function GET() {
  return NextResponse.json({ doctors: teleDoctors })
}
