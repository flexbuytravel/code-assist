"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StripeSuccessPage() {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const res = await fetch("/api/company/stripe/status");
        const data = await res.json();
        if (data.connected) {
          setConnected(true);
          // Redirect to company dashboard after a short delay
          setTimeout(() => {
            router.push("/company/dashboard");
          }, 2500);
        }
      } catch (err) {
        console.error("Error checking Stripe connection", err);
      } finally {
        setChecking(false);
      }
    };

    verifyConnection();
  }, [router]);

  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Stripe Connection</h1>

      {checking ? (
        <p>Verifying your connection with Stripe...</p>
      ) : connected ? (
        <p className="text-green-600 font-semibold">
          ✅ Your company’s Stripe account has been successfully connected!
          Redirecting to dashboard...
        </p>
      ) : (
        <p className="text-red-600 font-semibold">
          ❌ Stripe connection could not be verified. Please try again from your
          settings.
        </p>
      )}
    </div>
  );
}