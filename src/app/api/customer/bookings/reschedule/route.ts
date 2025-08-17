import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/bookings/reschedule
 * Allows a customer to reschedule a booking
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

    const { bookingId, newDate } = await request.json();

    if (!bookingId || !newDate) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId or newDate" },
        { status: 400 }
      );
    }

    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const bookingData = bookingSnap.data();

    if (bookingData?.customerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await bookingRef.set(
      { status: "rescheduled", rescheduledAt: new Date().toISOString(), newDate },
      { merge: true }
    );

    return NextResponse.json(
      { success: true, message: "Booking rescheduled successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error rescheduling booking:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}