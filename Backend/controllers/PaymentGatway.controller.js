import IndexModel from '../models/indexModel.js';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_APIVERSION,
});

const createPaymentIntent = async (req, res) => {
  try {
    const { userId, companyId, email } = req.user;
    const { priceId, currency, planId } = req.body;

    if (!priceId || !planId) {
      return res.status(400).json({ error: "Price ID and Plan ID are required" });
    }

    if (!userId || !email) {
      return res.status(401).json({ error: "User authentication required" });
    }

    const availablePlan = await IndexModel.Plan.findOne({ _id: priceId, deleted: false, isActive: true });
    if (!availablePlan) {
      return res.status(400).json({ error: "Invalid Plan selected" });
    }

    const company = await IndexModel.Company.findOne({ companyId });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const currentPlan = company.plan.find(p => p.planId === planId);
    if (!currentPlan) {
      return res.status(404).json({ error: "Selected plan not found in company" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: availablePlan.price * 100,
      currency: currency,
      payment_method_types: ["card"],
      metadata: { userId, companyId, planId },
      description: `Payment for ${availablePlan.name}`,
    });

    res.json({ clientSecret: paymentIntent.client_secret, planName: availablePlan.name });
  } catch (error) {
    console.error("❌ Error creating payment intent:", error.message);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

export default {
  createPaymentIntent,
};