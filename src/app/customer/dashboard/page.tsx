"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [packageData, setPackageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tripInsurance, setTripInsurance] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"deposit" | "full" | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchPackage = async () => {
      try {
        const pkgRef = doc(db, "packages", user.packageId);
        const pkgSnap = await getDoc(pkgRef);

        if (!pkgSnap.exists()) {
          setError("Package not found.");
          setIsLoading(false);
          return;
        }

        setPackageData(pkgSnap.data());
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error loading package data.");
        setIsLoading(false);
      }
    };

    fetchPackage();
  }, [user]);

  // Recalculate amount when options change
  useEffect(() => {
    if (!packageData) return;

    let basePrice = selectedPayment === "deposit" ? 200 : packageData.price;
    if (tripInsurance) {
      basePrice += selectedPayment === "deposit" ? 400 : packageData.price; // Double-up logic
    }
    setTotalAmount(basePrice);
  }, [selectedPayment, tripInsurance, packageData]);

  const handlePayment = async () => {
    if (!selectedPayment) {
      setError("Please select a payment option.");
      return;
    }

    try {
      // Create Stripe checkout session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: user.packageId,
          amount: totalAmount,
          paymentType: selectedPayment,
          insurance: tripInsurance,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Unable to start payment process.");
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  // If paid, show booking info
  if (packageData?.paidInFull || packageData?.depositPaid) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Your Trips</h1>
        <p>
          {packageData.paidInFull
            ? "You have paid in full. Your trips are active indefinitely."
            : `Deposit paid. You have ${packageData.tripCount} trips and ${packageData.bookingDeadline} to book.`}
        </p>
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <p>
            Call <strong>Monster Reservations</strong> at{" "}
            <a href="tel:1-800-555-1234" className="text-blue-600 underline">
              1-800-555-1234
            </a>{" "}
            to book your trips.
          </p>
        </div>
      </div>
    );
  }

  // Payment selection UI
  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>

      {error && <div className="bg-red-100 text-red-600 p-2 mb-4 rounded">{error}</div>}

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="payment"
            value="deposit"
            checked={selectedPayment === "deposit"}
            onChange={() => setSelectedPayment("deposit")}
            className="mr-2"
          />
          Pay Deposit ($200) — Adds 1 trip, extends booking window to 48 hours.
        </label>

        <label className="flex items-center">
          <input
            type="radio"
            name="payment"
            value="full"
            checked={selectedPayment === "full"}
            onChange={() => setSelectedPayment("full")}
            className="mr-2"
          />
          Pay in Full — Unlock all trips indefinitely.
        </label>

        <label className="flex items-center mt-4">
          <input
            type="checkbox"
            checked={tripInsurance}
            onChange={() => setTripInsurance(!tripInsurance)}
            className="mr-2"
          />
          Trip Insurance — Adds 1 trip for deposit, doubles trips for full payment.
        </label>

        <div className="text-lg font-semibold mt-4">Total: ${totalAmount}</div>

        <button
          onClick={handlePayment}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}