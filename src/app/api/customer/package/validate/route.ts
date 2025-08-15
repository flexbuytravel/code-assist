import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin"; // Correct casing for import
import { doc, getDoc } from "firebase/firestore";

/**
 * POST /api/customer/package/validate
 * Validates that a given package ID exists and is available for booking
 */
export async function POST(request: Request) {
  try {
    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "Missing packageId" },
        { status: 400 }
      );
    }

    // Reference the package in Firestore
    const packageRef = doc(db, "packages", packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();

    // Additional validation: check if package is active
    if (packageData.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Package is not available" },
        { status: 403 }
      );
    }

    // Return package data if valid
    return NextResponse.json(
      { success: true, package: packageData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error validating package:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}