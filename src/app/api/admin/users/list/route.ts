import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/users/list
 * Admin can fetch all users from Firestore
 */
export async function GET() {
  try {
    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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