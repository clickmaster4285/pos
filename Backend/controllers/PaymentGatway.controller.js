import IndexModel from '../models/indexModel.js';
import Stripe from "stripe";


const createPaymentIntent = async (req, res) => {
  try {
    const { userId, companyId, email } = req.user;
    const { priceId, currency, planId } = req.body;
      const adminUser = await IndexModel.User.findOne({role:"superAdmin", deleted: false}).lean();
    
    const stripe = new Stripe(adminUser.stripeConfig.secretKey, {
      apiVersion: process.env.STRIPE_APIVERSION,
    });
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


const getstrippublishkey = async (req, res) => {
  try {
      const strippublishkey = await IndexModel.User.findOne({
        role: "superAdmin",
        deleted: false,
      });
      
      if (!strippublishkey.stripeConfig.publishableKey) {
        return res.status(404).json({
          success: false,
          error: "publishableKey not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: strippublishkey.stripeConfig.publishableKey,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Server error while fetching company",
        details: error.message,
      });
    }
}

export default {
  createPaymentIntent,
  getstrippublishkey
};