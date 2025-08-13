// src/app/api/admin/company/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

/**
 * GET /api/admin/company/list
 * Lists all companies in Firestore.
 */
export async function GET(req: NextRequest) {
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

    // Fetch companies from Firestore
    const companiesSnapshot = await db.collection("companies").get();
    const companies: Record<string, any>[] = [];

    companiesSnapshot.forEach((doc) => {
      companies.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      message: "Companies fetched successfully",
      count: companies.length,
      data: companies,
    });
  } catch (error: any) {
    console.error("Error listing companies:", error);
    return NextResponse.json(
      { error: "Failed to list companies" },
      { status: 500 }
    );
  }
}