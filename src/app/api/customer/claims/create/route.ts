import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/claims/create
 * Creates a new claim for a package.
 */
export async function POST(request: Request) {
  try {
    const { userId, packageId, description } = await request.json();

    if (!userId || !packageId || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newClaim = {
      userId,
      packageId,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const claimRef = await adminDb.collection("claims").add(newClaim);

    return NextResponse.json(
      { success: true, claimId: claimRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}