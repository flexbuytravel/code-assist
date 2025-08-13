import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
  });
}

const auth = admin.auth();

async function seedAdminUser() {
  try {
    const email = "admin@flexbuytravel.com";
    const password = "Poopie22";
    const role = "admin";

    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✅ Admin user already exists: ${user.email}`);
    } catch {
      // Create user if not found
      user = await auth.createUser({
        email,
        password,
        emailVerified: true,
      });
      console.log(`✅ Created admin user: ${email}`);
    }

    // Set role claim
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`✅ Role claim set to "${role}" for ${email}`);

  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  }
}

seedAdminUser().then(() => {
  console.log("🚀 Seeding complete.");
  process.exit(0);
});