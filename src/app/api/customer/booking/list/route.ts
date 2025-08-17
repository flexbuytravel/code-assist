import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * GET /api/customer/booking/list
 * Returns all bookings for the authenticated customer
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

    // Query Firestore for bookings belonging to this user
    const bookingsQuery = await adminDb
      .collection("bookings")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const bookings = bookingsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing bookings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}