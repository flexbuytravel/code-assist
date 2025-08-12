
'use "use client";

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

  // 🔹 Calculate remaining time for the 48-hour purchase window
  const calculateTimeLeft = (claimedAt: number) => {
    const expiry = claimedAt + 48 * 60 * 60 * 1000; // 48 hours in ms
    const diff = expiry - Date.now();

    if (diff <= 0) {
      return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // 🔹 Secure role-based access & load package info
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

        // If packageClaimedAt exists, start countdown
        if (userData.packageClaimedAt) {
          setTimeLeft(calculateTimeLeft(userData.packageClaimedAt));
          const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(userData.packageClaimedAt));
          }, 1000);
          return () => clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setError("Error loading customer dashboard.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // 🔹 Original Customer Dashboard UI + Timer
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Customer Dashboard</h1>
      <p className="mb-6 text-lg">Welcome, {user?.name || "Customer"}.</p>

      {/* Show countdown if package claimed */}
      {user?.packageId && (
        <div className="bg-yellow-100 border border-yellow-300 rounded p-4 mb-6">
          <p className="font-semibold mb-2">
            Package: <span className="text-blue-700">{user.packageId}</span>
          </p>
          <p>
            Referral: <span className="text-blue-700">{user.referralId}</span>
          </p>
          <p className="mt-2">
            Time left to purchase:{" "}
            <span className="font-bold text-red-600">{timeLeft}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Checkout Link */}
        {user?.packageId && (
          <Link
            href={`/checkout?packageId=${user.packageId}`}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 shadow transition"
          >
            <h2 className="text-xl font-semibold mb-2">Proceed to Payment</h2>
            <p>Securely purchase your package before the timer expires.</p>
          </Link>
        )}

        {/* Payment History */}
        <Link
          href="/customer/payment-history"
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-6 shadow transition"
        >
          <h2 className="text-xl font-semibold mb-2">Payment History</h2>
          <p>View your past transactions and receipts.</p>
        </Link>
      </div>
    </div>
  );
}';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/protected-route';

function CustomerLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();
    const { customerData, loading, logout } = useAuth();
    
    const handleLogout = async () => {
        await logout();
        router.push('/home');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
            </div>
        );
    }

    if (!customerData) {
        return null;
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Image src="/logo2.png" alt="FlexBuy Logo" width={32} height={32} data-ai-hint="logo wave"/>
            <h1 className="text-xl font-bold font-headline text-primary">FlexBuy Portal</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="hidden md:inline">Welcome, {customerData.name}</span>
            </div>
          <Button variant="outline" size="icon" onClick={() => router.push('/home')}>
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}


export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith('/customer/login') || pathname.startsWith('/customer/create-account')) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute loginPath="/customer/login">
        <CustomerLayoutContent>
            {children}
        </CustomerLayoutContent>
    </ProtectedRoute>
  );
}
