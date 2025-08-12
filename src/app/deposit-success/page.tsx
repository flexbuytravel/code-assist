"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function DepositSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Confirming your deposit...");
  const customerId = searchParams.get("customerId");

  useEffect(() => {
    const confirmDeposit = async () => {
      if (!customerId) {
        setStatus("Missing customer information.");
        return;
      }

      try {
        const res = await fetch("/api/confirmDeposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId })
        });
        const data = await res.json();

        if (data.success) {
          setStatus("✅ Deposit confirmed! Your package is now locked for 6 months.");
        } else {
          setStatus("⚠️ Unable to confirm deposit. Please contact support.");
        }
      } catch (err) {
        console.error("Error confirming deposit:", err);
        setStatus("❌ Error confirming deposit. Please try again.");
      }
    };

    confirmDeposit();
  }, [customerId]);

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Deposit Payment Successful</h1>
      <p>{status}</p>
      <div className="mt-6">
        <a
          href="/customer/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded inline-block"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}