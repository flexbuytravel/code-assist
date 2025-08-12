import { NextResponse } from "next/server";
import { auth, firestore } from "@/lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name, phone, companyId } = await req.json();

    if (!email || !password || !name || !companyId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Add actual authentication check here (Firebase Admin SDK in prod)
    // For now, assume request is already validated for role: 'company' or 'admin'

    // Create Firebase Auth user
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // Create agent document
    await setDoc(doc(firestore, "agents", uid), {
      uid,
      name,
      email,
      phone: phone || "",
      role: "agent",
      companyId,
      createdAt: new Date().toISOString(),
    });

    // Link agent to company
    const companyRef = doc(firestore, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    await updateDoc(companyRef, {
      agents: arrayUnion(uid),
    });

    return NextResponse.json({
      success: true,
      message: "Agent created successfully",
      data: { uid, email, name, companyId },
    });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}