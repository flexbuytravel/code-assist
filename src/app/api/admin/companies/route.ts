import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { auth } from "@/lib/firebaseAdmin"; // Make sure you have firebase-admin initialized here
import { verifyAuth } from "@/lib/verifyAuth"; // Helper to check token & roles

const db = getFirestore();

// GET: List all companies
export async function GET(req: Request) {
  try {
    const { decodedToken, errorResponse } = await verifyAuth(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const snapshot = await db.collection("companies").get();
    const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ companies }, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

// POST: Create a new company
export async function POST(req: Request) {
  try {
    const { decodedToken, errorResponse } = await verifyAuth(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCompanyRef = await db.collection("companies").add({
      name,
      email,
      createdAt: new Date(),
      createdBy: decodedToken.uid,
    });

    return NextResponse.json({ id: newCompanyRef.id, message: "Company created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}

// DELETE: Delete a company and cascade delete agents
export async function DELETE(req: Request) {
  try {
    const { decodedToken, errorResponse } = await verifyAuth(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
    }

    const companyRef = db.collection("companies").doc(companyId);

    // Check if company exists
    const docSnap = await companyRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Cascade delete agents under the company
    const agentsSnap = await companyRef.collection("agents").get();
    for (const agentDoc of agentsSnap.docs) {
      await agentDoc.ref.delete();
    }

    // Optionally, mark packages as orphaned or reassign to admin — not deleting packages here
    // because they must remain tied to the company even if agents are gone

    await companyRef.delete();

    return NextResponse.json({ message: "Company and related agents deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}