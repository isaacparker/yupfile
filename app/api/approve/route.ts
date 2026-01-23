import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { token, action } = body

  if (!token || !action) {
    return NextResponse.json(
      { error: "Missing token or action" },
      { status: 400 }
    )
  }

  if (!["approve", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'decline'" },
      { status: 400 }
    )
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
        { error: "Invalid approval link. This link may be incorrect or has already been used." },
        { status: 404 }
      )
    }

    // Check if already approved or declined
    if (event.status !== "pending") {
      return NextResponse.json(
        {
          error: `This request has already been ${event.status}.`,
          status: event.status,
          approvedAt: event.approvedAt,
        },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (event.approvalTokenExpiry && new Date() > event.approvalTokenExpiry) {
      return NextResponse.json(
        { error: "This approval link has expired. Please contact the requester for a new link." },
        { status: 400 }
      )
    }

    // Update the event status
    const updatedEvent = await prisma.consentEvent.update({
      where: { id: event.id },
      data: {
        status: action === "approve" ? "approved" : "declined",
        approvedAt: action === "approve" ? new Date() : null,
      },
      include: {
        record: true,
      },
    })

    return NextResponse.json({
      success: true,
      status: updatedEvent.status,
      record: updatedEvent.record,
    })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    )
  }
}
