"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const customerRef = doc(db, "customers", user.uid);
    const unsubscribe = onSnapshot(customerRef, (snapshot) => {
      if (snapshot.exists()) {
        setCustomerData(snapshot.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <p className="text-center text-lg mt-8">Loading dashboard...</p>;
  }

  if (!customerData) {
    return <p className="text-center text-lg mt-8 text-red-500">
      No customer data found.
    </p>;
  }

  const { paymentStatus, tripsAvailable, bookingDeadline } = customerData;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Customer Dashboard</h1>

      {paymentStatus === "paid" ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <p className="text-green-700 font-semibold">✅ Payment Complete</p>
          <p className="mt-2">Trips Available: <strong>{tripsAvailable}</strong></p>
          {bookingDeadline && (
            <p className="mt-1">
              Booking Deadline: <strong>{new Date(bookingDeadline.seconds * 1000).toLocaleDateString()}</strong>
            </p>
          )}
          <p className="mt-4 text-gray-800">
            To book your trips, call: <strong>1-800-MONSTER</strong>
          </p>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
          <p className="text-yellow-700 font-semibold">⚠ Payment Pending</p>
          <p className="mt-2">Please complete payment within the next 48 hours.</p>
        </div>
      )}
    </div>
  );
}