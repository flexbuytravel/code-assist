// src/app/api/admin/company/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/company/update
 * Updates a company's details in Firestore.
 */
export async function PATCH(req: NextRequest) {
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

    const { companyId, updateData } = await req.json();

    if (!companyId || !updateData || typeof updateData !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid companyId/updateData" },
        { status: 400 }
      );
    }

    // Merge update data into the existing company doc
    await db.collection("companies").doc(companyId).set(updateData, { merge: true });

    return NextResponse.json({
      message: `Company ${companyId} updated successfully`,
      updatedFields: Object.keys(updateData),
    });
  } catch (error: any) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}