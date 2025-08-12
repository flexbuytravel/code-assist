"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // After splash delay, check auth state
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Get role from custom claims
            const tokenResult = await getIdTokenResult(user);
            const role = tokenResult.claims.role;

            switch (role) {
              case "admin":
                router.push("/admin-dashboard");
                break;
              case "company":
                router.push("/company-dashboard");
                break;
              case "agent":
                router.push("/agent-dashboard");
                break;
              case "customer":
                router.push("/customer-dashboard");
                break;
              default:
                // No recognized role → force logout and go to home
                await auth.signOut();
                router.push("/home");
                break;
            }
          } catch (err) {
            console.error("Error checking user role:", err);
            router.push("/home");
          }
        } else {
          // No user logged in → go to claim package page
          router.push("/home");
        }
        setLoading(false);
      });
    }, 2000); // splash display time in ms

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Image
        src="/logo2.png"
        alt="FlexBuy Logo"
        width={200}
        height={200}
        className="animate-pulse"
      />
    </div>
  );
}