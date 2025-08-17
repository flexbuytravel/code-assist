import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/agent/update
 * Updates agent data (role, companyId, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const { uid, role, companyId } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing agent UID" },
        { status: 400 }
      );
    }

    const agentRef = adminDb.collection("agents").doc(uid);

    const updateData: Record<string, any> = {};
    if (role) updateData.role = role;
    if (companyId) updateData.companyId = companyId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No update fields provided" },
        { status: 400 }
      );
    }

    await agentRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating agent:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}