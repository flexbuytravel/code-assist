import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("packageId");
  const referralCode = searchParams.get("referralCode");

  if (!packageId || !referralCode) {
    return NextResponse.json({ error: "Missing parameters." }, { status: 400 });
  }

  try {
    const pkgRef = doc(db, "packages", packageId);
    const pkgSnap = await getDoc(pkgRef);

    if (!pkgSnap.exists()) {
      return NextResponse.json({ valid: false, error: "Package not found." }, { status: 404 });
    }

    const pkgData = pkgSnap.data();
    if (pkgData.referralCode !== referralCode) {
      return NextResponse.json({ valid: false, error: "Referral code does not match." }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying package:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}