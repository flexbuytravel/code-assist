import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/customer/profile/update
 * Update a customer's profile
 */
export async function PATCH(request: Request) {
  try {
    const { customerId, updates } = await request.json();

    if (!customerId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing customerId or updates" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("customers").doc(customerId);
    await docRef.set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating customer profile:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}