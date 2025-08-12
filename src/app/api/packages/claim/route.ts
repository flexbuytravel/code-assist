import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { packageId, referralId } = await req.json();

    if (!packageId || !referralId) {
      return NextResponse.json({ error: "Package ID and Referral ID are required" }, { status: 400 });
    }

    const db = getFirestore(getFirebaseAdminApp());

    // Check the package exists
    const packageRef = db.collection("packages").doc(packageId);
    const packageSnap = await packageRef.get();

    if (!packageSnap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = packageSnap.data();

    // Validate referral match
    if (packageData?.referralId !== referralId) {
      return NextResponse.json({ error: "Referral ID does not match this package" }, { status: 403 });
    }

    // Check if package already claimed
    if (packageData?.claimedBy) {
      return NextResponse.json({ error: "This package has already been claimed" }, { status: 409 });
    }

    // Return safe package data for UI display
    return NextResponse.json({
      packageId,
      referralId,
      price: packageData.price,
      trips: packageData.trips,
      companyId: packageData.companyId,
      agentId: packageData.agentId,
    });
  } catch (error) {
    console.error("Error validating package claim:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}