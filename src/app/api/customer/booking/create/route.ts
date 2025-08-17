import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/booking/create
 * Creates a new booking for a customer
 */
export async function POST(request: Request) {
  try {
    const { customerId, packageId, date } = await request.json();

    if (!customerId || !packageId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing booking fields" },
        { status: 400 }
      );
    }

    const bookingRef = adminDb.collection("bookings").doc();
    await bookingRef.set({
      id: bookingRef.id,
      customerId,
      packageId,
      date,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, bookingId: bookingRef.id });
  } catch (err: any) {
    console.error("Error creating booking:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}