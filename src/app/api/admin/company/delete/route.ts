import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * DELETE /api/admin/company/delete
 * Deletes a company by companyId and optionally cascades agents.
 * Requires admin privileges.
 */
export async function DELETE(request: Request) {
  try {
    const { companyId, deleteAgents = false } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing companyId" },
        { status: 400 }
      );
    }

    // ✅ Verify auth & role (using Firebase Admin SDK)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ✅ Delete company
    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    await companyRef.delete();

    // ✅ Optionally delete all agents for that company
    if (deleteAgents) {
      const agentsSnap = await adminDb
        .collection("agents")
        .where("companyId", "==", companyId)
        .get();

      const batch = adminDb.batch();
      agentsSnap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    return NextResponse.json(
      {
        success: true,
        message: `Company ${companyId} deleted${
          deleteAgents ? " with agents" : ""
        }`,
      },
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