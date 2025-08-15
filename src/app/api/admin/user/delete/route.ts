import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin"; // Corrected to match actual file
import { getAuth } from "firebase/auth";

/**
 * DELETE /api/admin/user/delete
 * Deletes a user account by UID (admin only)
 */
export async function DELETE(request: Request) {
  try {
    const { uid, role } = await request.json();

    // Check required parameters
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Verify role
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(uid);

    return NextResponse.json(
      { success: true, message: `User ${uid} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}