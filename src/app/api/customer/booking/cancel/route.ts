import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * DELETE /api/customer/booking/cancel
 * Cancels an existing booking belonging to the authenticated customer
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId" },
        { status: 400 }
      );
    }

    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();
    if (bookingData?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: cannot cancel someone else’s booking" },
        { status: 403 }
      );
    }

    // Instead of hard delete, we soft-cancel by updating status
    await bookingRef.update({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Booking cancelled" }, { status: 200 });
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}