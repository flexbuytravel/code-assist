"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getRoleFromClaims, hasRole } from "@/lib/roles";
import Sidebar from "@/components/layout/Sidebar";

export default function CustomerDashboard() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      const role = await getRoleFromClaims(currentUser);
      if (!hasRole({ ...currentUser, role }, "customer")) {
        router.push("/auth/login");
        return;
      }

      const customerDoc = await getDoc(doc(db, "customers", currentUser.uid));
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        setCustomer(data);
        if (data.claimedAt) {
          startCountdown(new Date(data.claimedAt.seconds * 1000));
        }
      }
    });
    return () => unsub();
  }, [auth, db, router]);

  const startCountdown = (claimedAt: Date) => {
    const deadline = new Date(claimedAt.getTime() + 48 * 60 * 60 * 1000);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = deadline.getTime() - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>
        {customer && (
          <>
            <p>Welcome, {customer.name}</p>
            {timeLeft && (
              <div className="mt-4 p-4 bg-yellow-100 rounded border border-yellow-300">
                <p className="font-semibold">
                  Time left to purchase: {timeLeft}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}