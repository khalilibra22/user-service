import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { SubscriptionModel } from "../models/subscription.model";
import { TransactionModel } from "../models/transaction.model";
import { SubscriptionService } from "../services/subscription.service";
import { getLogger } from "../utils/logger";
import { LessThan } from "typeorm";

const logger = getLogger();

/**
 * Job to check for subscriptions that are pending payment for too long
 * and mark them as inactive/expired.
 */
export const startSubscriptionCleanupCron = () => {
    // ── Job 1: Clean up pending_payment subscriptions that timed out (every 10 min) ──
    cron.schedule("*/10 * * * *", async () => {
        logger.info("Running subscription cleanup cron job...");
        try {
            const subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
            const transactionRepo = AppDataSource.getRepository(TransactionModel);

            const pendingSubscriptions = await subscriptionRepo.find({
                where: { status: "pending_payment" }
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
                const transaction = await transactionRepo.findOne({
                    where: {
                        referenceType: "SUBSCRIPTION",
                        referenceId: sub.id.toString()
                    },
                    order: { createdAt: "DESC" }
                });

                let shouldExpire = false;

                if (!transaction) {
                    // No transaction found — expire if older than 24h as a fallback
                    if (sub.createdAt && sub.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else if (transaction.provider === "satim") {
                    // Automated payment: 24h timeout
                    if (sub.createdAt && sub.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else {
                    // Manual payment
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin — DO NOT EXPIRE
                        continue;
                    }
                    // No receipt yet: 3-day timeout
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

            logger.info(`Subscription cleanup done. Timed-out ${expiredCount} subscriptions.`);
        } catch (error) {
            logger.error({ err: error }, "Error in subscription cleanup cron job");
        }
    });

    // ── Job 2: Expire active subscriptions + apply scheduled downgrades (hourly) ──
    cron.schedule("0 * * * *", async () => {
        logger.info("Running subscription expiration checker...");
        try {
            const subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
            const now = new Date();

            // Find all active subscriptions whose billing period has ended
            const expiredSubs = await subscriptionRepo.find({
                where: { status: "active", endDate: LessThan(now) },
                relations: ["user", "plan"],
            });

            if (expiredSubs.length === 0) {
                logger.info("No expired active subscriptions found.");
                return;
            }

            for (const sub of expiredSubs) {
                try {
                    const { container: cont } = await import("../container");
                    const { SubscriptionService } = await import("../services/subscription.service");
                    const subscriptionService = cont.resolve(SubscriptionService);

                    if (sub.scheduledPlanId && sub.user) {
                        // ── Apply scheduled downgrade ──
                        const planRepo = AppDataSource.getRepository(require("../models/plan.model").PlanModel);
                        const newPlan = await planRepo.findOne({ where: { id: sub.scheduledPlanId } });

                        if (newPlan) {
                            // Atomicly deactivate previous plans FIRST
                            await subscriptionService.deactivateOtherActiveSubscriptions(sub.user.id!);

                            // Create new active subscription under the downgraded plan
                            const newSub = subscriptionRepo.create({
                                user: sub.user,
                                plan: newPlan,
                                status: "active",
                                startDate: now,
                                endDate: subscriptionService.addDurationToDate(now, newPlan.duration!, newPlan.durationUnit!),
                            });

                            await subscriptionRepo.save(newSub);

                            // Update user's plan reference
                            const { container: cont } = await import("../container");
                            const { UserService } = await import("../services/user.service");
                            const userService = cont.resolve(UserService);
                            sub.user.plan = newPlan;
                            await userService.updateUser(sub.user.id!, sub.user);

                            logger.info({ userId: sub.user.id, newPlanId: newPlan.id, subId: sub.id }, "Scheduled downgrade applied atomicly");
                        } else {
                            logger.warn({ scheduledPlanId: sub.scheduledPlanId, subId: sub.id }, "Scheduled plan not found — expiring subscription without downgrade");
                        }
                    } else if (sub.user) {
                        // ── No downgrade scheduled — fallback to default free plan ──
                        const { container: cont2 } = await import("../container");
                        const { SubscriptionService: SS } = await import("../services/subscription.service");
                        const subscriptionService = cont2.resolve(SS);
                        try {
                            const freeSubscription = await subscriptionService.assignDefaultFreePlan(sub.user.id!);
                            if (!freeSubscription) {
                                // If no free plan was assigned (e.g. none exists), clear the user's plan completely
                                const { container: cont3 } = await import("../container");
                                const { UserService } = await import("../services/user.service");
                                const userService = cont3.resolve(UserService);
                                sub.user.plan = undefined;
                                await userService.updateUser(sub.user.id!, sub.user);
                            } else {
                                logger.info({ userId: sub.user.id }, "Auto-assigned default free plan upon expiration of active subscription");
                            }
                        } catch (assignError) {
                            logger.error({ err: assignError, userId: sub.user.id }, "Error auto-assigning free plan, falling back to clearing user plan");
                            const { container: cont4 } = await import("../container");
                            const { UserService } = await import("../services/user.service");
                            const userService = cont4.resolve(UserService);
                            sub.user.plan = undefined;
                            await userService.updateUser(sub.user.id!, sub.user);
                        }
                    }

                    // Mark current subscription as inactive
                    sub.status = "inactive";
                    sub.scheduledPlanId = null;
                    sub.renewalStatus = null;
                    await subscriptionRepo.save(sub);
                } catch (subError) {
                    logger.error({ err: subError, subId: sub.id }, "Error processing expired subscription in expiration cron");
                }
            }

            logger.info({ count: expiredSubs.length }, "Subscription expiration job completed");
        } catch (error) {
            logger.error({ err: error }, "Error in subscription expiration cron job");
        }
    });
};
