"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/home");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", u.uid));
      const userData = userDoc.data();
      if (!userData || userData.role !== "customer") {
        router.push("/home");
        return;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking</h1>
      <p>Here you can view or manage your bookings.</p>
    </div>
  );
}