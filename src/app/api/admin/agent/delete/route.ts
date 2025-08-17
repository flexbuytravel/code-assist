import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * DELETE /api/admin/agent/delete
 * Deletes an agent user by UID
 */
export async function DELETE(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing agent UID" },
        { status: 400 }
      );
    }

    await adminAuth.deleteUser(uid);
    await adminDb.collection("agents").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting agent:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}