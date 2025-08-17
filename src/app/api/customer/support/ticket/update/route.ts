import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/support/ticket/update
 * Updates a support ticket (only if owned by the customer and still open)
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

    const { ticketId, message } = await request.json();

    if (!ticketId || !message) {
      return NextResponse.json({ success: false, error: "Missing ticketId or message" }, { status: 400 });
    }

    const ticketRef = adminDb.collection("supportTickets").doc(ticketId);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const ticketData = ticketSnap.data();
    if (ticketData?.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (ticketData?.status !== "open") {
      return NextResponse.json({ success: false, error: "Cannot update closed ticket" }, { status: 400 });
    }

    await ticketRef.collection("messages").add({
      sender: userId,
      message,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Ticket updated" }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}