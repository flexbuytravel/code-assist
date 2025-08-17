import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/users/update-role
 * Updates a user's role (admin, agent, customer).
 */
export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "Missing userId or role" },
        { status: 400 }
      );
    }

    await adminAuth.setCustomUserClaims(userId, { role });

    return NextResponse.json(
      { success: true, message: `Role updated to ${role}` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}