import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { packageId, referralId } = await req.json();

    if (!packageId || !referralId) {
      return NextResponse.json(
        { error: "Package ID and Referral ID are required" },
        { status: 400 }
      );
    }

    // Get package
    const packageRef = doc(db, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();

    // Ensure referral matches the package's agentId
    if (packageData.agentId !== referralId) {
      return NextResponse.json(
        { error: "Referral ID does not match this package" },
        { status: 400 }
      );
    }

    // Ensure it's not already claimed
    if (packageData.claimedBy) {
      return NextResponse.json(
        { error: "This package has already been claimed" },
        { status: 400 }
      );
    }

    // If valid, return the package data (optional for UI preview)
    return NextResponse.json(
      {
        success: true,
        package: {
          id: packageId,
          ...packageData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating package:", error);
    return NextResponse.json(
      { error: "Server error while validating package" },
      { status: 500 }
    );
  }
}