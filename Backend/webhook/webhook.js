import Stripe from "stripe";
import IndexModel from '../models/indexModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const stripWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!endpointSecret) {
    console.error("❌ Stripe webhook secret not configured");
    return res.status(500).send("Server configuration error");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Stripe event received:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "v2.core.event_destination.ping":
      console.log("🏓 Stripe ping event received");
      break;
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("✅ Payment succeeded:", paymentIntent.id);
      try {
        const { userId, companyId, planId } = paymentIntent.metadata;
        await IndexModel.User.updateOne(
          { userId },
          { $set: { subscription: { planId, status: 'active', paymentIntentId: paymentIntent.id } } }
        );
        console.log(`Updated subscription for user ${userId}`);
      } catch (error) {
        console.error("❌ Error updating subscription:", error.message);
      }
      break;
    case "payment_intent.payment_failed":
      console.log("❌ Payment failed:", event.data.object.id);
      break;
    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.sendStatus(200);
};

export default { stripWebhook };