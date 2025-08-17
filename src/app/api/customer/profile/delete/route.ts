import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * DELETE /api/customer/profile/delete
 * Deletes a customer's profile and Firebase Auth user
 */
export async function DELETE(request: Request) {
  try {
    const { customerId, authUid } = await request.json();

    if (!customerId || !authUid) {
      return NextResponse.json(
        { success: false, error: "Missing customerId or authUid" },
        { status: 400 }
      );
    }

    // Delete profile
    await adminDb.collection("customers").doc(customerId).delete();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(authUid);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting customer profile:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}