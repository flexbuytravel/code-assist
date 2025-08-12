// src/lib/roles.ts

/**
 * Define all supported roles in the system.
 */
export type UserRole = "admin" | "company" | "agent" | "customer";

/**
 * Helper: Check if the user has a specific role.
 */
export function hasRole(user: any, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Helper: Check if the user has one of multiple roles.
 */
export function hasAnyRole(user: any, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Helper: Assign a role to a user.
 * This function is used after Firebase Auth user creation,
 * and should also be mirrored in custom claims if needed.
 */
export async function assignRole(uid: string, role: UserRole) {
  const { getFirestore, doc, setDoc } = await import("firebase/firestore");
  const db = getFirestore();
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    { role, updatedAt: new Date() },
    { merge: true }
  );
}

/**
 * Helper: Get a user's role from their ID token claims.
 */
export async function getRoleFromClaims(user: any): Promise<UserRole | null> {
  if (!user) return null;
  const tokenResult = await user.getIdTokenResult(true);
  return (tokenResult.claims.role as UserRole) || null;
}