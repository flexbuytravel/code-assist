import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/customer/booking/cancel
 * Cancels a customer booking
 */
export async function PATCH(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("bookings").doc(bookingId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    await docRef.set({ status: "cancelled" }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error cancelling booking:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}