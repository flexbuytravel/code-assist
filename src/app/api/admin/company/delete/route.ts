import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin"; // Correct imports
import { doc, deleteDoc, collection, getDocs, query, where } from "firebase-admin/firestore";

/**
 * DELETE /api/admin/company/delete
 * Deletes a company and any related agents
 */
export async function POST(request: Request) {
  try {
    const { companyId, adminUid } = await request.json();

    if (!companyId || !adminUid) {
      return NextResponse.json(
        { success: false, error: "Missing companyId or adminUid" },
        { status: 400 }
      );
    }

    // Verify admin privileges
    const adminUser = await adminAuth.getUser(adminUid);
    if (!adminUser.customClaims || adminUser.customClaims.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete company
    await deleteDoc(doc(adminDb, "companies", companyId));

    // Find and delete related agents
    const agentsRef = collection(adminDb, "agents");
    const q = query(agentsRef, where("companyId", "==", companyId));
    const snapshot = await getDocs(q);

    for (const agentDoc of snapshot.docs) {
      await deleteDoc(doc(adminDb, "agents", agentDoc.id));
    }

    return NextResponse.json(
      { success: true, message: "Company and related agents deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}