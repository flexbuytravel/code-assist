import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/claims/update
 * Updates a claim (customer can update description while pending).
 */
export async function POST(request: Request) {
  try {
    const { claimId, description } = await request.json();

    if (!claimId || !description) {
      return NextResponse.json(
        { success: false, error: "Missing claimId or description" },
        { status: 400 }
      );
    }

    const claimRef = adminDb.collection("claims").doc(claimId);
    const claimSnap = await claimRef.get();

    if (!claimSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }

    const claimData = claimSnap.data();
    if (claimData?.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending claims can be updated" },
        { status: 403 }
      );
    }

    await claimRef.update({ description });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating claim:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}