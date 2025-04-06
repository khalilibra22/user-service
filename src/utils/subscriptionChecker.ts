// subscription-expiration-checker.ts
import cron from "node-cron";
import { SubscriptionService } from "../services/subscription.service";

const subscriptionService = new SubscriptionService();

//Schedule to run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running subscription expiration checker...");
  await subscriptionService.checkExpiredSubscriptions().catch((error) => {
    console.error("Error checking expired subscriptions:", error);
  });
});
