import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/claims/list
 * Lists all claims for admin review.
 */
export async function GET() {
  try {
    const claimsRef = adminDb.collection("claims");
    const snapshot = await claimsRef.get();

    const claims = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, claims }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing admin claims:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}