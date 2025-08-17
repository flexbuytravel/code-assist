import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * GET /api/customer/support/ticket/list
 * Lists all support tickets for the authenticated customer
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const ticketsSnap = await adminDb
      .collection("supportTickets")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const tickets = ticketsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, tickets }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing tickets:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}