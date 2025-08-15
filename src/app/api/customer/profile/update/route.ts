import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { doc, updateDoc } from "firebase-admin/firestore";

/**
 * POST /api/customer/profile/update
 * Updates customer profile details
 */
export async function POST(request: Request) {
  try {
    const { userId, updates } = await request.json();

    if (!userId || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);

    return NextResponse.json(
      { success: true, message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}