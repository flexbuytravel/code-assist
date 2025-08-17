import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * GET /api/customer/bookings/list
 * Lists all bookings for the authenticated customer
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

    const bookingsRef = adminDb
      .collection("bookings")
      .where("customerId", "==", userId)
      .orderBy("createdAt", "desc");

    const snapshot = await bookingsRef.get();

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing bookings:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}