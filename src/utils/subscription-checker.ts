// subscription-expiration-checker.ts
import cron from "node-cron";
import { SubscriptionService } from "../services/subscription.service";
import { getLogger } from "./logger";

const subscriptionService = new SubscriptionService();
const logger = getLogger();

//Schedule to run every day at midnight
cron.schedule("0 0 * * *", async () => {
  logger.info("Running subscription expiration checker...");
  await subscriptionService.checkExpiredSubscriptions().catch((error) => {
    logger.error({ err: error }, "Error checking expired subscriptions");
  });
});
