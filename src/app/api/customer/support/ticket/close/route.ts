import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/support/ticket/close
 * Closes a support ticket owned by the authenticated customer
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

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ success: false, error: "Missing ticketId" }, { status: 400 });
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

    await ticketRef.set({ status: "closed", closedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ success: true, message: "Ticket closed" }, { status: 200 });
  } catch (error: any) {
    console.error("Error closing ticket:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}