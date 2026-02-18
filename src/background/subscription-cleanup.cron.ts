import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { SubscriptionModel } from "../models/subscription.model";
import { getLogger } from "../utils/logger";
import { LessThan } from "typeorm";

const logger = getLogger();

/**
 * Job to check for subscriptions that are pending payment for too long
 * and mark them as inactive/expired.
 */
export const startSubscriptionCleanupCron = () => {
    // Run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        logger.info("Running subscription cleanup cron job...");
        try {
            const subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
            const transactionRepo = AppDataSource.getRepository(require("../models/transaction.model").TransactionModel);

            const pendingSubscriptions = await subscriptionRepo.find({
                where: {
                    status: "pending_payment"
                }
            });

            if (pendingSubscriptions.length === 0) {
                logger.info("No pending subscriptions found.");
                return;
            }

            const now = new Date();
            const satimLimit = new Date(now);
            satimLimit.setHours(satimLimit.getHours() - 24);

            const manualLimit = new Date(now);
            manualLimit.setHours(manualLimit.getHours() - 72); // 3 days

            let expiredCount = 0;

            for (const sub of pendingSubscriptions) {
                if (!sub.id) continue;
                // Find associated transaction
                const transaction = await transactionRepo.findOne({
                    where: {
                        referenceType: "SUBSCRIPTION",
                        referenceId: sub.id.toString()
                    },
                    order: { createdAt: "DESC" }
                });

                let shouldExpire = false;

                if (!transaction) {
                    // No transaction found? Maybe something went wrong during creation.
                    // Expire if older than 24h as a fallback.
                    if (sub.createdAt && sub.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else if (transaction.provider === "satim") {
                    // Automated payment: 24h
                    if (sub.createdAt && sub.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else {
                    // Manual payment
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin. DO NOT EXPIRE.
                        continue;
                    }

                    // No receipt uploaded yet: 3 days
                    if (sub.createdAt && sub.createdAt < manualLimit) {
                        shouldExpire = true;
                    }
                }

                if (shouldExpire) {
                    sub.status = "inactive";
                    await subscriptionRepo.save(sub);
                    logger.info({ subscriptionId: sub.id }, "Marked subscription as inactive due to non-payment timeout");
                    expiredCount++;
                }
            }

            logger.info(`Subscription cleanup cron job completed. Expired ${expiredCount} subscriptions.`);
        } catch (error) {
            logger.error({ err: error }, "Error in subscription cleanup cron job");
        }
    });
};
