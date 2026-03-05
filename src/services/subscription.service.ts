import { LessThan } from "typeorm";
import { AppDataSource } from "../config/database";
import { PlanModel } from "../models/plan.model";
import { SubscriptionModel } from "../models/subscription.model";
import { getLogger } from "../utils/logger";

const log = getLogger();

export class SubscriptionService {
  subscriptionRepo: any;
  planRepo: any;

  constructor() {
    this.subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
    this.planRepo = AppDataSource.getRepository(PlanModel);
  }

  async createPlan(plan: PlanModel): Promise<PlanModel> {
    try {
      return await this.planRepo.save(plan);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'createPlan' } }, 'Error creating plan');
      throw new Error("Error creating plan");
    }
  }

  async updatePlan(planId: string, data: Partial<PlanModel>): Promise<PlanModel> {
    try {
      const plan = await this.planRepo.findOne({ where: { id: planId } });
      if (!plan) throw new Error("Plan not found");
      Object.assign(plan, data);
      return await this.planRepo.save(plan);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'updatePlan', planId } }, 'Error updating plan');
      throw error;
    }
  }

  async deactivatePlan(planId: string): Promise<PlanModel> {
    try {
      const plan = await this.planRepo.findOne({ where: { id: planId } });
      if (!plan) throw new Error("Plan not found");
      plan.isActive = false;
      return await this.planRepo.save(plan);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'deactivatePlan', planId } }, 'Error deactivating plan');
      throw error;
    }
  }

  async getPlanById(planId: string): Promise<PlanModel | null> {
    try {
      return await this.planRepo.findOne({
        where: { id: planId },
        cache: {
          id: `plan_${planId}`,
          milliseconds: 1800000, // 30 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getPlanById', planId } }, 'Error fetching plan');
      throw new Error("Error fetching plan");
    }
  }

  async getPlans(): Promise<PlanModel[]> {
    try {
      return await this.planRepo.find({
        where: { isActive: true },
        cache: {
          id: 'all_plans',
          milliseconds: 1800000, // 30 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getPlans' } }, 'Error fetching plans');
      throw new Error("Error fetching plans");
    }
  }

  async createSubscription(
    subscription: SubscriptionModel
  ): Promise<SubscriptionModel> {
    try {
      // Default to pending_payment if not specified
      if (!subscription.status) {
        subscription.status = "pending_payment";
      }
      // startDate and endDate are NOT set here — only set when activated
      return await this.subscriptionRepo.save(subscription);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'createSubscription' } }, 'Error creating subscription');
      throw new Error("Error creating subscription");
    }
  }

  /**
   * Check if the user already has an active subscription for the given plan.
   */
  async getActiveSubscriptionByUserAndPlan(
    userId: string,
    planId: string | number
  ): Promise<SubscriptionModel | null> {
    try {
      return await this.subscriptionRepo.findOne({
        where: { user: { id: userId }, plan: { id: planId }, status: "active" },
        relations: ["plan"],
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getActiveSubscriptionByUserAndPlan', userId, planId } }, 'Error checking existing subscription');
      throw new Error("Error checking existing subscription");
    }
  }

  async activateSubscription(subscriptionId: string | number): Promise<SubscriptionModel> {
    try {
      const subscription = await this.subscriptionRepo.findOne({ where: { id: subscriptionId }, relations: ["user", "plan"] });
      if (!subscription) throw new Error("Subscription not found");

      subscription.status = "active";
      const now = new Date();
      subscription.startDate = now;

      if (subscription.plan) {
        subscription.endDate = this.addDurationToDate(
          now,
          subscription.plan.duration,
          subscription.plan.durationUnit
        );
      }

      const updatedSubscription = await this.subscriptionRepo.save(subscription);

      // Update user's active plan
      if (subscription.user && subscription.plan) {
        const { UserService } = await import("./user.service");
        const userService = new UserService();
        subscription.user.plan = subscription.plan;
        await userService.updateUser(subscription.user.id, subscription.user);
      }

      return updatedSubscription;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'activateSubscription', subscriptionId } }, 'Error activating subscription');
      throw new Error("Error activating subscription");
    }
  }

  async deactivateSubscription(subscriptionId: string | number): Promise<SubscriptionModel> {
    try {
      const subscription = await this.subscriptionRepo.findOne({
        where: { id: subscriptionId },
        relations: ["user", "plan"],
      });
      if (!subscription) throw new Error("Subscription not found");

      subscription.status = "inactive";
      const savedSubscription = await this.subscriptionRepo.save(subscription);

      // Clear the user's plan reference when deactivating
      if (subscription.user) {
        const { UserService } = await import("./user.service");
        const userService = new UserService();
        subscription.user.plan = undefined;
        await userService.updateUser(subscription.user.id, subscription.user);
      }

      return savedSubscription;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'deactivateSubscription', subscriptionId } }, 'Error deactivating subscription');
      throw new Error("Error deactivating subscription");
    }
  }

  async cancelSubscription(subscriptionId: string | number, userId: string): Promise<SubscriptionModel> {
    try {
      const subscription = await this.subscriptionRepo.findOne({
        where: { id: subscriptionId },
        relations: ["user", "plan"],
      });
      if (!subscription) throw new Error("Subscription not found");
      if (subscription.user?.id !== userId) throw new Error("Unauthorized: subscription does not belong to this user");
      if (subscription.status === "cancelled") throw new Error("Subscription is already cancelled");

      subscription.status = "cancelled";
      const savedSubscription = await this.subscriptionRepo.save(subscription);

      // Clear the user's plan reference on cancellation
      if (subscription.user) {
        const { UserService } = await import("./user.service");
        const userService = new UserService();
        subscription.user.plan = undefined;
        await userService.updateUser(subscription.user.id, subscription.user);
      }

      return savedSubscription;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'cancelSubscription', subscriptionId, userId } }, 'Error cancelling subscription');
      throw error;
    }
  }

  /**
   * RENEW — same plan, new billing period.
   * Creates a new pending_payment subscription starting from the current endDate
   * (or now if the old one is already expired). Payment must be completed to activate.
   * Returns { subscription, planPrice } — caller creates the payment transaction.
   */
  async renewSubscription(
    userId: string,
    options?: { couponCode?: string; paymentMethod?: string; returnUrl?: string; failUrl?: string }
  ): Promise<{
    newSubscription: SubscriptionModel;
    plan: PlanModel;
    renewsFrom: Date;
  }> {
    try {
      // Get the user's most recent active (or recently expired) subscription
      const existing = await this.subscriptionRepo.findOne({
        where: [
          { user: { id: userId }, status: "active" },
          { user: { id: userId }, status: "inactive" },
        ],
        relations: ["user", "plan"],
        order: { createdAt: "DESC" },
      });

      if (!existing || !existing.plan) {
        throw new Error("No existing subscription found to renew");
      }

      // The new period starts from the CURRENT endDate (if in future) or NOW (if already expired)
      const now = new Date();
      const renewsFrom = existing.endDate && existing.endDate > now ? new Date(existing.endDate) : now;

      // Mark old subscription as renewal-pending so the cron/payment handler knows
      existing.renewalStatus = "renew";
      await this.subscriptionRepo.save(existing);

      // Create the new subscription record (pending_payment by default)
      const newSubscription = this.subscriptionRepo.create({
        user: existing.user,
        plan: existing.plan,
        status: "pending_payment",
        renewalStatus: null,
      });
      const saved = await this.subscriptionRepo.save(newSubscription);

      log.info({ userId, planId: existing.plan.id, renewsFrom }, "Renewal subscription created");
      return { newSubscription: saved, plan: existing.plan, renewsFrom };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'renewSubscription', userId } }, 'Error renewing subscription');
      throw error;
    }
  }

  /**
   * Activates a renewal subscription — called by handlePostPayment on SUCCESS.
   * Sets startDate = renewsFrom (from metadata) and calculates endDate from plan duration.
   */
  async activateRenewalSubscription(subscriptionId: string | number, renewsFrom: Date): Promise<SubscriptionModel> {
    try {
      const subscription = await this.subscriptionRepo.findOne({
        where: { id: subscriptionId },
        relations: ["user", "plan"],
      });
      if (!subscription) throw new Error("Subscription not found");

      subscription.status = "active";
      subscription.startDate = renewsFrom;

      if (subscription.plan) {
        subscription.endDate = this.addDurationToDate(
          renewsFrom,
          subscription.plan.duration,
          subscription.plan.durationUnit
        );
      }

      const updated = await this.subscriptionRepo.save(subscription);

      // Update user's plan reference
      if (subscription.user && subscription.plan) {
        const { UserService } = await import("./user.service");
        const userService = new UserService();
        subscription.user.plan = subscription.plan;
        await userService.updateUser(subscription.user.id, subscription.user);
      }

      return updated;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'activateRenewalSubscription', subscriptionId } }, 'Error activating renewal');
      throw error;
    }
  }

  /**
   * UPGRADE — switch to a higher-tier plan immediately.
   * Cancels current subscription and creates a new pending_payment one for the new plan.
   * The caller must create a payment transaction. On success, the new subscription activates.
   */
  async upgradeSubscription(
    userId: string,
    newPlanId: string
  ): Promise<{ newSubscription: SubscriptionModel; plan: PlanModel }> {
    try {
      const newPlan = await this.planRepo.findOne({ where: { id: newPlanId, isActive: true } });
      if (!newPlan) throw new Error("Target plan not found or inactive");

      const currentSubscription = await this.subscriptionRepo.findOne({
        where: { user: { id: userId }, status: "active" },
        relations: ["user", "plan"],
        order: { createdAt: "DESC" },
      });

      if (!currentSubscription) throw new Error("No active subscription found to upgrade");
      if (!currentSubscription.plan) throw new Error("Current subscription has no plan");

      const currentPrice = Number(currentSubscription.plan.price ?? 0);
      const newPrice = Number(newPlan.price ?? 0);

      if (newPrice <= currentPrice) {
        throw new Error("Target plan is not an upgrade. Use downgradeSubscription to switch to a lower-tier plan.");
      }

      // Cancel the current subscription immediately
      currentSubscription.status = "cancelled";
      currentSubscription.renewalStatus = "upgrade";
      await this.subscriptionRepo.save(currentSubscription);

      // Clear user plan (will be re-set when new subscription activates)
      if (currentSubscription.user) {
        const { UserService } = await import("./user.service");
        const userService = new UserService();
        currentSubscription.user.plan = undefined;
        await userService.updateUser(currentSubscription.user.id, currentSubscription.user);
      }

      // Create new subscription (pending_payment — activateSubscription sets dates on payment success)
      const newSubscription = this.subscriptionRepo.create({
        user: currentSubscription.user,
        plan: newPlan,
        status: "pending_payment",
      });
      const saved = await this.subscriptionRepo.save(newSubscription);

      log.info({ userId, fromPlanId: currentSubscription.plan.id, toPlanId: newPlan.id }, "Upgrade subscription created");
      return { newSubscription: saved, plan: newPlan };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'upgradeSubscription', userId, newPlanId } }, 'Error upgrading subscription');
      throw error;
    }
  }

  /**
   * DOWNGRADE — switch to a lower-tier plan at the END of the current billing period.
   * The current subscription stays active until endDate. The new plan is stored in
   * scheduledPlanId and picked up by the cleanup cron when the period expires.
   */
  async downgradeSubscription(
    userId: string,
    newPlanId: string
  ): Promise<{ subscription: SubscriptionModel; scheduledPlan: PlanModel }> {
    try {
      const newPlan = await this.planRepo.findOne({ where: { id: newPlanId, isActive: true } });
      if (!newPlan) throw new Error("Target plan not found or inactive");

      const currentSubscription = await this.subscriptionRepo.findOne({
        where: { user: { id: userId }, status: "active" },
        relations: ["user", "plan"],
        order: { createdAt: "DESC" },
      });

      if (!currentSubscription) throw new Error("No active subscription found to downgrade");
      if (!currentSubscription.plan) throw new Error("Current subscription has no plan");

      const currentPrice = Number(currentSubscription.plan.price ?? 0);
      const newPrice = Number(newPlan.price ?? 0);

      if (newPrice >= currentPrice) {
        throw new Error("Target plan is not a downgrade. Use upgradeSubscription to switch to a higher-tier plan.");
      }

      if (currentSubscription.scheduledPlanId === newPlan.id) {
        throw new Error("A downgrade to this plan is already scheduled");
      }

      // Schedule the downgrade — current access stays until endDate
      currentSubscription.scheduledPlanId = newPlan.id;
      currentSubscription.renewalStatus = "downgrade";
      const updated = await this.subscriptionRepo.save(currentSubscription);

      log.info({
        userId,
        fromPlanId: currentSubscription.plan.id,
        toPlanId: newPlan.id,
        effectiveDate: currentSubscription.endDate,
      }, "Downgrade scheduled for end of billing period");

      return { subscription: updated, scheduledPlan: newPlan };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'downgradeSubscription', userId, newPlanId } }, 'Error scheduling downgrade');
      throw error;
    }
  }

  private addDurationToDate(startDate: Date, duration: number = 1, unit: string = 'months'): Date {
    const date = new Date(startDate);
    if (unit === 'days') {
      date.setDate(date.getDate() + duration);
    } else if (unit === 'years') {
      date.setFullYear(date.getFullYear() + duration);
    } else {
      // Default to months
      date.setMonth(date.getMonth() + duration);
    }
    return date;
  }

  async getActiveSubscriptionsByUserId(
    userId: string
  ): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { user: { id: userId }, status: "active" }, // Fixed: was isActive: true (field doesn't exist)
        relations: ["plan"],
        cache: {
          id: `active_subscriptions_${userId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getActiveSubscriptionsByUserId', userId } }, 'Error fetching active subscriptions');
      throw new Error("Error fetching active subscriptions");
    }
  }

  async getAllSubscriptionsByUserId(
    userId: string
  ): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { user: { id: userId } },
        relations: ["plan"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getAllSubscriptionsByUserId', userId } }, 'Error fetching all subscriptions for user');
      throw new Error("Error fetching subscriptions");
    }
  }

  async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      const expiredSubscriptions = await this.subscriptionRepo.find({
        where: {
          status: "active",
          endDate: LessThan(now),
        },
        relations: ["user"],
      });

      if (expiredSubscriptions.length > 0) {
        for (const sub of expiredSubscriptions) {
          sub.status = "inactive";
          // Clear user plan on expiry
          if (sub.user) {
            const { UserService } = await import("./user.service");
            const userService = new UserService();
            sub.user.plan = undefined;
            await userService.updateUser(sub.user.id, sub.user);
          }
        }
        await this.subscriptionRepo.save(expiredSubscriptions);
        log.info({ count: expiredSubscriptions.length }, "Marked expired subscriptions as inactive");
      }
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'checkExpiredSubscriptions' } }, 'Error checking expired subscriptions');
      throw new Error("Error checking expired subscriptions");
    }
  }

  // Get all active subscriptions (admin)
  async getActiveSubscriptions(): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { status: "active" },
        relations: ["user", "plan"],
        cache: {
          id: 'all_active_subscriptions',
          milliseconds: 120000, // 2 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getActiveSubscriptions' } }, 'Error fetching active subscriptions');
      throw new Error("Error fetching active subscriptions");
    }
  }
}
