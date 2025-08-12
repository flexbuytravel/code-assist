import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

async function deleteAgent(agentId: string) {
  // Step 1: Get all packages by this agent
  const packagesRef = collection(db, "packages");
  const q = query(packagesRef, where("agentId", "==", agentId));
  const snapshot = await getDocs(q);

  // Step 2: Nullify agentId but keep companyId
  for (const pkg of snapshot.docs) {
    await updateDoc(pkg.ref, {
      agentId: null,
      deletedAgent: true // optional flag
    });
  }

  // Step 3: Delete agent doc
  await deleteDoc(doc(db, "agents", agentId));

  alert("Agent deleted. Packages remain linked to company.");
}