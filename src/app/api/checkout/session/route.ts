// Retrieve the company associated with the package
const companyRef = db.collection("companies").doc(companyId);
const companyDoc = await companyRef.get();
if (!companyDoc.exists) {
  return NextResponse.json({ error: "Company not found" }, { status: 404 });
}

const stripeAccountId = companyDoc.data()?.stripeAccountId;

const session = await stripe.checkout.sessions.create(
  {
    // ... your existing checkout data
    payment_intent_data: {
      transfer_data: {
        destination: stripeAccountId, // Send payment to company
      },
    },
  },
  stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
);