import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { packageId, referralCode } = await req.json();

    if (!packageId || !referralCode) {
      return NextResponse.json({ error: 'Missing packageId or referralCode' }, { status: 400 });
    }

    const packageRef = doc(db, 'packages', packageId);
    const packageSnap = await getDoc(packageRef);

    if (!packageSnap.exists()) {
      return NextResponse.json({ valid: false, message: 'Package not found' }, { status: 404 });
    }

    const packageData = packageSnap.data();
    if (packageData.referralCode !== referralCode) {
      return NextResponse.json({ valid: false, message: 'Invalid referral code' }, { status: 401 });
    }

    return NextResponse.json({ valid: true, package: packageData });
  } catch (err) {
    console.error('Package validation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}