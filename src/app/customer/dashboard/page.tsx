"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Calculate countdown
  const calculateTimeLeft = (claimedAt: number) => {
    const expiry = claimedAt + 48 * 60 * 60 * 1000; // 48 hours
    const diff = expiry - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/home");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (!userDoc.exists()) {
          setError("User record not found.");
          return;
        }
        const userData = userDoc.data();
        if (userData.role !== "customer") {
          router.push("/home");
          return;
        }

        setUser({ uid: u.uid, ...userData });

        if (userData.packageClaimedAt) {
          setTimeLeft(calculateTimeLeft(userData.packageClaimedAt));
          const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(userData.packageClaimedAt));
          }, 1000);
          return () => clearInterval(interval);
        }
      } catch {
        setError("Error loading dashboard.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Customer Dashboard</h1>
      {user?.packageId && (
        <div className="mb-4">
          <p><span className="font-semibold">Package:</span> {user.packageId}</p>
          <p><span className="font-semibold">Referral:</span> {user.referralId}</p>
          <p><span className="font-semibold">Time left:</span> <span className="font-bold text-red-600">{timeLeft}</span></p>
        </div>
      )}
      <div className="space-y-4">
        {user?.packageId && (
          <Link href={`/checkout?packageId=${user.packageId}`} className="bg-green-600 text-white px-4 py-2 rounded">
            Proceed to Payment
          </Link>
        )}
      </div>
    </div>
  );
}