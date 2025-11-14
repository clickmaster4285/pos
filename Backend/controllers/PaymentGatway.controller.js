import IndexModel from '../models/indexModel.js';
import Stripe from "stripe";
import mongoose from 'mongoose';
import { generatePlanId } from "../utils/generatePlanIdPurchased.js";

const createPaymentIntent = async (req, res) => {
  try {
    const { userId, companyId, email } = req.user;
    const { priceId, planId } = req.body;
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
    const companyPlanId = await generatePlanId(companyId, userId);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: availablePlan.price*100, // amount in smallest currency unit
      currency: availablePlan.currencyCode,
      payment_method_types: ["card"],
      metadata: { userId, companyId, planId, companyPlanId },
      description: `Payment for ${availablePlan.name}`,
    });
    res.json({ clientSecret: paymentIntent.client_secret, planName: availablePlan.name, companyPlanId:companyPlanId });
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

const confirmAndUpgradePlan = async (req, res) => {
  try {
    const { companyId, pricePlanMongoId, planId, paymentIntentId, companyPlanId } = req.body;
    const { userId } = req.user || {};

    if (!companyId || !pricePlanMongoId || !planId || !paymentIntentId) {
      return res.status(400).json({
        error:
          'companyId, pricePlanMongoId, planId, paymentIntentId are required',
      });
    }

    // 1) Stripe secret key: prefer superAdmin key, fallback to env
    const adminUser = await IndexModel.User.findOne(
      { role: 'superAdmin', deleted: false },
      { 'stripeConfig.secretKey': 1 }
    ).lean();

    const secretKey =
      adminUser?.stripeConfig?.secretKey || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: process.env.STRIPE_APIVERSION,
    });

    // 2) Verify payment intent
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!pi || pi.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // 3) Load catalog plan (the one you sell)
    const pricePlan = await IndexModel.Plan.findOne({
      _id: pricePlanMongoId,
      deleted: false,
      isActive: true,
    }).lean();

    if (!pricePlan) {
      return res.status(400).json({ error: 'Plan not found or inactive' });
    }

    // 4) Make sure company exists up front
    const company = await IndexModel.Company.findOne({ companyId }).lean();
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // 5) Prepare the company plan entry
    const newCompanyPlan = {
      _id: new mongoose.Types.ObjectId(),
      planId, // your company-level plan id string
      companyPlanId: companyPlanId,
      ...pricePlan,
      isActive: true,
      status: 'in progress',
      deleted: false,
      createdBy: userId || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 6) Deactivate previous plans only if the array exists
    await IndexModel.Company.updateOne(
      { companyId, 'plan.0': { $exists: true } },
      {
        $set: { 'plan.$[].isActive': false },
        $currentDate: { updatedAt: true },
      }
    );

    // 7) Push new plan + history
    const upd = await IndexModel.Company.updateOne(
      { companyId },
      {
        $push: {
          plan: newCompanyPlan,
          history: {
            action: 'PLAN_UPGRADED',
            performedBy: String(userId || 'system'),
            createdAt: new Date(),
          },
        },
        $currentDate: { updatedAt: true },
      }
    );

    if (upd.matchedCount === 0) {
      return res.status(404).json({ error: 'Company not found (update)' });
    }

    // 8) ✅ Add a new subscription entry
    await IndexModel.Company.updateOne(
      { companyId },
      {
        $push: {
          subscription: {
            planId:companyPlanId,
            status: 'complete',
            paymentIntentId,
            companyId,
            createdby: userId || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        $currentDate: { updatedAt: true },
      }
    );

    return res.json({
      success: true,
      message: 'Plan upgraded and subscription created',
      plan: newCompanyPlan,
    });
  } catch (err) {
    console.error('confirmAndUpgradePlan error:', err);
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to upgrade plan' });
  }
};

export default {
  createPaymentIntent,
  getstrippublishkey,
    confirmAndUpgradePlan,
};