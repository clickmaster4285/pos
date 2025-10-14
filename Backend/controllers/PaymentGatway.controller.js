import IndexModel from '../models/indexModel.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import mongoose from 'mongoose';
import Stripe from "stripe";



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_APIVERSION,
});

const createPaymentIntent = async (req, res) => {
  try {
    const { userId, companyId, email } = req.user;
    const { priceId, currency } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    if (!userId || !email) {
      return res.status(401).json({ error: "User authentication required" });
    }
    const plan = await IndexModel.Plan.findOne({_id:priceId, deleted: false, isActive:true});

    if (!plan.price) {
      return res.status(400).json({ error: "Invalid Plan selected" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100,
      currency: currency,
      payment_method_types: ["card"],
      metadata: { userId, companyId: companyId || "none", planId: priceId },
      description: `Payment for ${plan.name}`,
    });

    res.json({ clientSecret: paymentIntent.client_secret, planName: plan.name });
  } catch (error) {
    console.error("❌ Error creating payment intent:", error.message);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

export default {
  createPaymentIntent,
};
