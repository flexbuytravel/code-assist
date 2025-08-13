// src/app/api/admin/company/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/company/create
 * Creates a new company document in Firestore.
 */
export async function POST(req: NextRequest) {
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

    const { companyId, name, address, phone, email } = await req.json();

    if (!companyId || !name) {
      return NextResponse.json(
        { error: "companyId and name are required" },
        { status: 400 }
      );
    }

    const companyRef = db.collection("companies").doc(companyId);
    const docSnapshot = await companyRef.get();

    if (docSnapshot.exists) {
      return NextResponse.json(
        { error: `Company with ID ${companyId} already exists` },
        { status: 409 }
      );
    }

    const newCompany = {
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      createdAt: new Date().toISOString(),
    };

    await companyRef.set(newCompany);

    return NextResponse.json({
      message: `Company ${companyId} created successfully`,
      data: newCompany,
    });
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}