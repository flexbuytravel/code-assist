import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/users/list
 * Lists all users (paginated).
 */
export async function GET() {
  try {
    const listUsers = await adminAuth.listUsers(1000);

    const users = listUsers.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      role: user.customClaims?.role || "customer",
    }));

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}