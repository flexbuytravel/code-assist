
import * as admin from "firebase-admin";
import Stripe from "stripe";
import express from "express";
import cors from "cors";
import { https, params } from "firebase-functions/v2";

admin.initializeApp();
const db = admin.firestore();

// Define the Stripe secret key from environment configuration
const stripeSecretKey = params.defineString("STRIPE_SECRET_KEY");

const app = express();

// IMPORTANT: The cors middleware must come before the express.json() middleware
// to ensure pre-flight OPTIONS requests are handled correctly without trying to parse a body.
app.use(cors()); 
app.options('*', cors()); 
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required." });
    }

    const stripeClient = new Stripe(stripeSecretKey.value(), {
        apiVersion: "2024-04-10",
        typescript: true
    });
    
    const account = await stripeClient.accounts.create({
      type: "express",
    });

    await db.collection('companies').doc(companyId).update({ stripeAccountId: account.id });

    // Use the provided origin for redirects, fallback to production URL
    const returnUrlBase = "http://localhost:9003";
    const refresh_url = `${returnUrlBase}/company/settings`;
    const return_url = `${returnUrlBase}/company/stripe-connected`;

    const accountLink = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url,
      return_url: return_url,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { amount, customerEmail, referralCode, packageId, success_url, cancel_url } = req.body;

        if (!packageId) return res.status(400).json({ error: 'Package ID is required.' });
        if (!referralCode) return res.status(400).json({ error: 'Referral code is required.' });
        if (!success_url) return res.status(400).json({ error: 'Success URL is required.' });
        if (!cancel_url) return res.status(400).json({ error: 'Cancel URL is required.' });
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'A valid amount is required.' });
        }

        const agentsRef = db.collection('agents');
        const agentQuery = await agentsRef.where('referralCode', '==', referralCode).limit(1).get();

        if (agentQuery.empty) {
          return res.status(404).json({ error: 'Invalid referral code.' });
        }
        const agent = agentQuery.docs[0].data();
        
        const companyRef = db.collection('companies').doc(agent.companyId);
        const companyDoc = await companyRef.get();

        if (!companyDoc.exists) {
          return res.status(404).json({ error: 'Company not found for this agent.' });
        }
        const company = companyDoc.data();
        const stripeAccountId = company?.stripeAccountId;
 
        if (!stripeAccountId) {
            return res.status(500).json({ error: 'The destination company has not connected their Stripe account.' });
        }
        
        const stripeClient = new Stripe(stripeSecretKey.value(), {
            apiVersion: "2024-04-10",
            typescript: true
        });

        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `FlexBuy Package: ${packageId}`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: success_url,
            cancel_url: cancel_url,
            customer_email: customerEmail,
            payment_intent_data: {
                application_fee_amount: Math.round(amount * 100 * 0.10),
                transfer_data: {
                    destination: stripeAccountId,
                },
            },
            client_reference_id: packageId,
        });

        return res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('Stripe checkout session error:', error);
        return res.status(500).json({ error: 'Failed to create checkout session.' });
    }
});

// Correctly export the Express app as a v2 HTTPS function
export const connect_redirect = https.onRequest({
  secrets: ["STRIPE_SECRET_KEY"]
}, app);
