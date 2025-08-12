import { getAuth, getIdTokenResult } from "firebase/auth";

/**
 * Fetch role from custom claims
 */
export async function getRoleFromClaims(user: any): Promise<string | null> {
  if (!user) return null;
  try {
    const tokenResult = await getIdTokenResult(user);
    return tokenResult.claims.role || null;
  } catch (err) {
    console.error("Error fetching role from claims:", err);
    return null;
  }
}

/**
 * Role match helper
 */
export function hasRole(user: any, role: string): boolean {
  return user?.role === role;
}

/**
 * Multi-role check helper
 */
export function hasAnyRole(user: any, roles: string[]): boolean {
  return roles.includes(user?.role);
}

/**
 * Assign role to user in Firebase Auth custom claims
 * Must be done in a Firebase Cloud Function with admin privileges.
 */
export async function assignRole(uid: string, role: string) {
  // This is just the frontend interface — the actual setting of the role
  // is done in a secure Cloud Function using admin.auth().setCustomUserClaims
  try {
    const res = await fetch("/api/setUserRole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, role }),
    });
    if (!res.ok) throw new Error("Failed to assign role");
    return await res.json();
  } catch (err) {
    console.error("Error assigning role:", err);
    throw err;
  }
}

/**
 * Convenience role shortcuts
 */
export function isAdmin(user: any) {
  return hasRole(user, "admin");
}

export function isCompany(user: any) {
  return hasRole(user, "company");
}

export function isAgent(user: any) {
  return hasRole(user, "agent");
}

export function isCustomer(user: any) {
  return hasRole(user, "customer");
}