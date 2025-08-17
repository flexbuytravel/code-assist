import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/customer/package/book
 * Allows a customer to book a package.
 * Requires Firebase Auth Bearer token.
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Parse body
    const { packageId } = await request.json();
    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "Missing packageId" },
        { status: 400 }
      );
    }

    // Check package exists and is active
    const packageRef = adminDb.collection("packages").doc(packageId);
    const packageSnap = await packageRef.get();

    if (!packageSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    const packageData = packageSnap.data();
    if (packageData?.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Package not available" },
        { status: 403 }
      );
    }

    // Create booking
    const bookingRef = adminDb.collection("bookings").doc();
    await bookingRef.set({
      userId,
      packageId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, bookingId: bookingRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error booking package:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}