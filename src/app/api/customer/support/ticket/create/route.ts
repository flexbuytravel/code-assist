import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/support/ticket/create
 * Creates a new support ticket
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Missing subject or message" },
        { status: 400 }
      );
    }

    const ticketRef = await adminDb.collection("supportTickets").add({
      userId,
      subject,
      message,
      status: "open",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, ticketId: ticketRef.id, message: "Ticket created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}