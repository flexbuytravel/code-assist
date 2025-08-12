"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/home");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          router.push("/home");
          return;
        }
        const data = userDoc.data();
        if (data.role !== "admin") {
          router.push("/home");
          return;
        }
        setUserData(data);
      } catch (err) {
        console.error("Error loading admin data:", err);
        router.push("/home");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/home");
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-600">{userData?.email}</p>
        </div>
        <nav className="p-4 space-y-2">
          <SidebarLink href="/admin/dashboard" label="Dashboard" active={pathname === "/admin/dashboard"} />
          <SidebarLink href="/admin/agents" label="Agents" active={pathname.startsWith("/admin/agents")} />
          <SidebarLink href="/admin/companies" label="Companies" active={pathname.startsWith("/admin/companies")} />
          <SidebarLink href="/admin/settings" label="Settings" active={pathname.startsWith("/admin/settings")} />
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded ${
        active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}