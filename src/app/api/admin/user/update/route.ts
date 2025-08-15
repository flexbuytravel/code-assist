import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin"; // Correct capitalization
import { getAuth } from "firebase/auth";

/**
 * PATCH /api/admin/user/update
 * Updates a Firebase Auth user (admin only)
 */
export async function PATCH(request: Request) {
  try {
    const { uid, updates, role } = await request.json();

    // Validate inputs
    if (!uid || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing UID or updates" },
        { status: 400 }
      );
    }

    // Verify admin role
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update user
    await adminAuth.updateUser(uid, updates);

    return NextResponse.json(
      { success: true, message: `User ${uid} updated successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}