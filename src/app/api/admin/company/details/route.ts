import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { doc, getDoc } from "firebase-admin/firestore";

/**
 * GET /api/admin/company/details?id=<companyId>
 * Returns full company details by ID (admin only)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing companyId" },
        { status: 400 }
      );
    }

    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: companySnap.data() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}