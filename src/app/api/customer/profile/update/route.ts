import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/customer/profile/update
 * Updates customer profile fields
 */
export async function PATCH(request: Request) {
  try {
    const { uid, ...updateData } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing UID" },
        { status: 400 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No update fields provided" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("customers").doc(uid);
    await docRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}