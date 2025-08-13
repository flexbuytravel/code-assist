import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { authMiddleware } from "@/lib/auth-middleware";

export const DELETE = authMiddleware(async (req, user, { params }) => {
  const { id } = params;

  try {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if company exists
    const companyDoc = await db.collection("companies").doc(id).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get all agents for this company
    const agentsSnapshot = await db.collection("agents").where("companyId", "==", id).get();

    // Delete all agents for the company
    const batch = db.batch();
    agentsSnapshot.forEach((agentDoc) => {
      batch.delete(agentDoc.ref);
    });

    // Delete the company
    batch.delete(db.collection("companies").doc(id));

    await batch.commit();

    return NextResponse.json({
      message: "Company and all associated agents deleted. Packages remain attached to company ID."
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
});