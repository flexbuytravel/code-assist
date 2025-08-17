import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/users/update
 * Admin can update a user’s role or status.
 */
export async function POST(request: Request) {
  try {
    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing userId or updates" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await userRef.update(updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}