import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateApprovalToken, generateSlug, generateTokenExpiry } from "@/lib/tokens"
import { generateConsentText } from "@/lib/consent-copy"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Get workspace from cookie
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get("consay_workspace_id")?.value

  if (!workspaceId) {
    return NextResponse.json(
      { error: "No workspace selected. Please select or create a workspace first." },
      { status: 400 }
    )
  }

  // Verify workspace belongs to user
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: user.id,
    },
  })

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const body = await request.json()
  const { contentUrl, creatorHandle, platform, scope } = body

  // Validate required fields
  if (!contentUrl || !creatorHandle || !platform || !scope) {
    return NextResponse.json(
      { error: "Missing required fields: contentUrl, creatorHandle, platform, scope" },
      { status: 400 }
    )
  }

  // Validate scope
  if (!["organic", "paid_ads", "organic_and_ads"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 })
  }

  try {
    // Generate unique slug (with collision check)
    let slug = generateSlug()
    let slugExists = await prisma.consentRecord.findUnique({ where: { slug } })
    while (slugExists) {
      slug = generateSlug()
      slugExists = await prisma.consentRecord.findUnique({ where: { slug } })
    }

    // Generate consent text
    const consentText = generateConsentText({
      creatorHandle,
      platform,
      contentUrl,
      scope,
    })

    // Generate approval token
    const approvalToken = generateApprovalToken()
    const approvalTokenExpiry = generateTokenExpiry()

    // Create consent record with initial event
    const record = await prisma.consentRecord.create({
      data: {
        slug,
        contentUrl,
        creatorHandle,
        platform,
        workspaceId: workspace.id,
        events: {
          create: {
            eventType: "initial",
            scope,
            consentText,
            status: "pending",
            approvalToken,
            approvalTokenExpiry,
          },
        },
      },
      include: {
        events: true,
      },
    })

    // Generate approval URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const approvalUrl = `${baseUrl}/approve/${approvalToken}`

    return NextResponse.json({
      record,
      approvalUrl,
      consentText,
    })
  } catch (error) {
    console.error("Error creating consent record:", error)
    return NextResponse.json(
      { error: "Failed to create consent record" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Get workspace from cookie
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get("consay_workspace_id")?.value

  if (!workspaceId) {
    return NextResponse.json([])
  }

  // Fetch all records for the workspace
  const records = await prisma.consentRecord.findMany({
    where: {
      workspaceId,
      workspace: {
        userId: user.id,
      },
    },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 1, // Get latest event for status
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(records)
}
