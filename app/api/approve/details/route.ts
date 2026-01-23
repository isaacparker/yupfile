import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  try {
    // Find the consent event by approval token
    const event = await prisma.consentEvent.findUnique({
      where: { approvalToken: token },
      include: {
        record: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Invalid approval link. This link may be incorrect." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      event,
      record: event.record,
    })
  } catch (error) {
    console.error("Error fetching approval details:", error)
    return NextResponse.json(
      { error: "Failed to load approval details" },
      { status: 500 }
    )
  }
}
