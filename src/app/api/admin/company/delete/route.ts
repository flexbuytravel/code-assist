// src/app/api/admin/company/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

/**
 * DELETE /api/admin/company/delete
 * Deletes a company and optionally all linked agents.
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify Firebase Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { companyId, deleteAgents = false } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      );
    }

    // Delete the company document
    await db.collection("companies").doc(companyId).delete();

    // Optionally delete all agents linked to this company
    if (deleteAgents) {
      const agentsSnapshot = await db
        .collection("agents")
        .where("companyId", "==", companyId)
        .get();

      const batch = db.batch();
      agentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return NextResponse.json({
      message: `Company ${companyId} deleted successfully`,
      agentsDeleted: deleteAgents ? "Yes" : "No",
    });
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}