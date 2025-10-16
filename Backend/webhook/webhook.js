import Stripe from "stripe";
import IndexModel from '../models/indexModel.js';


const stripWebhook = async (req, res) => {
  const adminUser = await IndexModel.User.findOne({role:"superAdmin", deleted: false}).lean();
  const stripe = new Stripe(adminUser.stripeConfig.secretKey, {
    apiVersion: "2023-10-16",
  });
  const endpointSecret = adminUser.stripeConfig.webhookSigningSecret;
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
        console.log("the paymentIntent.metadata are: ", paymentIntent.metadata);
        const { userId, companyId, planId } = paymentIntent.metadata;

        // Update company plan isActive status
        await IndexModel.Company.updateOne(
          { companyId, 'plan.planId': planId },
          {
            $set: {
              'plan.$.isActive': true,
              'plan.$.updatedAt': new Date(),
              'plan.$.status': "in progress",
            },
            $push: {
              subscription: {
                planId,
                status: 'complete',
                paymentIntentId: paymentIntent.id,
                companyId,
                createdby: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          }
        );
        console.log(`Activated plan ${planId} for company ${companyId}`);
      } catch (error) {
        console.error("❌ Error updating subscription or company plan:", error.message);
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