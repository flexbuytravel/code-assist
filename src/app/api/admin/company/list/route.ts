import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin"; // Correct import

/**
 * GET /api/admin/company/list
 * Lists all companies in Firestore.
 * Requires the user to be authenticated as an admin.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    if (decodedToken.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Query all companies
    const companiesSnapshot = await adminDb.collection("companies").get();
    const companies = companiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(
      { success: true, companies },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error listing companies:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}