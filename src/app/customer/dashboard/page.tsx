"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CustomerDashboard({ user }) {
  const router = useRouter();
  const [packageDetails, setPackageDetails] = useState(null);
  const [isDeposit, setIsDeposit] = useState(false);
  const [isDoubleUp, setIsDoubleUp] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Load customer package data from Firestore
    async function fetchPackage() {
      try {
        const res = await axios.get(`/api/customer/package?customerId=${user.uid}`);
        setPackageDetails(res.data);
        setTotalAmount(res.data.price);
      } catch (error) {
        console.error("Error loading package:", error);
      }
    }
    fetchPackage();
  }, [user]);

  useEffect(() => {
    if (packageDetails) {
      let amount = packageDetails.price;
      if (isDeposit) amount = 200;
      if (isDoubleUp) amount += 600;
      setTotalAmount(amount);
    }
  }, [isDeposit, isDoubleUp, packageDetails]);

  const handleCheckout = async () => {
    try {
      const res = await axios.post("/api/checkout/session", {
        packageId: packageDetails.id,
        referralId: packageDetails.referralId,
        customerId: user.uid,
        amount: totalAmount,
        paymentType: isDeposit ? "deposit" : "full",
        isDoubleUp,
      });
      window.location.href = res.data.url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  if (!packageDetails) return <div>Loading package...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Package</h1>
      <p><strong>Package Name:</strong> {packageDetails.name}</p>
      <p><strong>Base Price:</strong> ${packageDetails.price}</p>
      <p><strong>Trips Included:</strong> {packageDetails.trips}</p>

      <div className="mt-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isDeposit}
            onChange={() => {
              setIsDeposit(!isDeposit);
              setIsDoubleUp(false);
            }}
          />
          <span>Pay Deposit ($200) — Adds 1 Trip, Extends Time 6 Months</span>
        </label>

        <label className="flex items-center space-x-2 mt-2">
          <input
            type="checkbox"
            checked={isDoubleUp}
            onChange={() => {
              setIsDoubleUp(!isDoubleUp);
              setIsDeposit(false);
            }}
          />
          <span>Double Up ($600) — Doubles Trips, Extends Time 54 Months</span>
        </label>
      </div>

      <p className="mt-4 text-lg font-semibold">Total: ${totalAmount}</p>

      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleCheckout}
      >
        Proceed to Payment
      </button>
    </div>
  );
}