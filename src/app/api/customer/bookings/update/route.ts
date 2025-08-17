import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/customer/booking/update
 * Updates an existing booking belonging to the authenticated customer
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { bookingId, updates } = await request.json();

    if (!bookingId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId or updates" },
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
        { success: false, error: "Forbidden: cannot update someone else’s booking" },
        { status: 403 }
      );
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ["date", "notes", "status"];
    const safeUpdates: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      if (allowedUpdates.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    }

    await bookingRef.update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
