import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/agent/list?companyId=COMPANY_ID
 * Lists agents for a given company
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    let query = adminDb.collection("agents");
    if (companyId) {
      query = query.where("companyId", "==", companyId);
    }

    const snapshot = await query.get();
    const agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, agents });
  } catch (err: any) {
    console.error("Error listing agents:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}