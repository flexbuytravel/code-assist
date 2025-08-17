import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/agent/create
 * Creates a new agent user tied to a company
 */
export async function POST(request: Request) {
  try {
    const { email, password, companyId, role } = await request.json();

    if (!email || !password || !companyId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: role === "manager" ? "Manager" : "Agent",
    });

    await adminDb.collection("agents").doc(userRecord.uid).set({
      email,
      companyId,
      role: role || "agent",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error("Error creating agent:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}