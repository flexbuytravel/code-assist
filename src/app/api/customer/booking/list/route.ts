import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/customer/booking/list?customerId=...
 * Lists all bookings for a customer
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Missing customerId" },
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("bookings")
      .where("customerId", "==", customerId)
      .get();

    const bookings = snap.docs.map((doc) => doc.data());

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    console.error("Error listing bookings:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}