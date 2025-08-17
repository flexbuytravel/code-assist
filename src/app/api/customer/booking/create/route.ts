import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/booking/create
 * Creates a booking for the authenticated customer
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

    const { packageId, date, notes } = await request.json();

    if (!packageId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing packageId or date" },
        { status: 400 }
      );
    }

    // Create booking document
    const bookingRef = adminDb.collection("bookings").doc();
    await bookingRef.set({
      userId,
      packageId,
      date,
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, bookingId: bookingRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}