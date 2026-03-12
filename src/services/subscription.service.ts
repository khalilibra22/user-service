import { LessThan, Not } from "typeorm";
import { AppDataSource } from "../config/database";
import { PlanModel } from "../models/plan.model";
import { SubscriptionModel } from "../models/subscription.model";
import { UserModel } from "../models/user.model";
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
      const saved = await this.planRepo.save(plan);
      // Invalidate the plan list cache so new plan is visible immediately
      await AppDataSource.queryResultCache?.remove(['all_plans']);
      return saved;
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
      const saved = await this.planRepo.save(plan);
      // Bust both the list and the individual plan cache
      await AppDataSource.queryResultCache?.remove(['all_plans', `plan_${planId}`]);
      return saved;
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
      const saved = await this.planRepo.save(plan);
      await AppDataSource.queryResultCache?.remove(['all_plans', `plan_${planId}`]);
      return saved;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'deactivatePlan', planId } }, 'Error deactivating plan');
      throw error;
    }
  }

  async getPlanById(planId: string): Promise<PlanModel | null> {
    try {
      return await this.planRepo.findOne({
        where: { id: planId },
        // ✅ CACHED — admin-only writes. Invalidated on updatePlan / deactivatePlan.
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
        // ✅ CACHED — admin-only writes. Invalidated on createPlan / updatePlan / deactivatePlan.
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
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getActiveSubscriptionByUserAndPlan', userId, planId } }, 'Error checking existing subscription');
      throw new Error("Error checking existing subscription");
    }
  }

  async activateSubscription(subscriptionId: string | number): Promise<SubscriptionModel> {
    try {
      const subscription = await this.subscriptionRepo.findOne({ 
        where: { id: subscriptionId }, 
        relations: ["user", "plan"],
        cache: false,
      });
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

      // Deactivate any currently active subscriptions for this user
      if (subscription.user) {
        await this.deactivateOtherActiveSubscriptions(subscription.user.id, Number(subscription.id));
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
        cache: false,
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
        cache: false,
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
        cache: false,
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

      // Deactivate any currently active subscriptions for this user
      if (subscription.user) {
        await this.deactivateOtherActiveSubscriptions(subscription.user.id, Number(subscription.id));
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

      // DO NOT cancel the current subscription immediately.
      // It will be deactivated automatically in activateSubscription() when the new one is paid.
      currentSubscription.renewalStatus = "upgrade";
      await this.subscriptionRepo.save(currentSubscription);

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

  /**
   * Automatically assigns the default free plan to a user if they don't have an active subscription.
   * Finds the active plan with type='free', creates a subscription for it, and activates it immediately.
   * COMPREHENSIVE FIX: Uses a database transaction and Pessimistic Lock to prevent duplicates.
   */
  async assignDefaultFreePlan(userId: string): Promise<SubscriptionModel | null> {
    const { AppDataSource } = await import("../config/database");

    return await AppDataSource.transaction(async (manager) => {
      try {
        // 1. Lock the user row to prevent concurrent assignment from multiple servers
        const user = await manager.getRepository(UserModel).findOne({
          where: { id: userId },
          lock: { mode: "pessimistic_write" }
        });

        if (!user) {
          log.error({ userId }, "Failed to auto-assign free plan: User not found.");
          return null;
        }

        const freePlan = await manager.getRepository(PlanModel).findOne({
          where: { type: "free", isActive: true },
          cache: false
        });

        if (!freePlan) {
          log.error("Default free plan (type: free, isActive: true) not found.");
          return null;
        }

        // 2. Double check active subscriptions WHILE HOLDING THE LOCK
        // We use an explicit QueryBuilder to avoid any relationship-mapping ambiguities.
        const activeSubs = await manager.getRepository(SubscriptionModel)
          .createQueryBuilder("sub")
          .leftJoinAndSelect("sub.plan", "plan")
          .where("sub.userId = :userId", { userId })
          .andWhere("sub.status = :status", { status: "active" })
          .setLock("pessimistic_write")
          .getMany();

        if (activeSubs.length > 0) {
          const activeFreeSub = activeSubs.find(s => s.plan?.id === freePlan.id);
          if (activeFreeSub) {
            log.info({ userId, subId: activeFreeSub.id }, "User already has active free plan. Skipping duplicate creation.");
            return activeFreeSub;
          }
          
          log.info({ userId, planTypes: activeSubs.map(s => s.plan?.type) }, "User has another active plan. Skipping free plan.");
          return null;
        }

        // 3. Deactivate any stray plans (safety guard)
        await this.deactivateOtherActiveSubscriptions(userId, undefined, manager);

        // 4. Create new plan
        const now = new Date();
        const newSub = manager.getRepository(SubscriptionModel).create({
          user,
          plan: freePlan,
          status: "active",
          startDate: now,
          endDate: this.addDurationToDate(now, freePlan.duration || 1, freePlan.durationUnit || 'months'),
        });

        const saved = await manager.getRepository(SubscriptionModel).save(newSub);

        // 5. Update User's plan reference
        user.plan = freePlan;
        await manager.getRepository(UserModel).save(user);

        log.info({ userId, subscriptionId: saved.id }, "Successfully assigned default free plan via Atomic Transaction with Lock");
        return saved;

      } catch (error) {
        log.error({ err: error, userId }, "Error in assignDefaultFreePlan transaction");
        throw error; // Rollback
      }
    });
  }

  public addDurationToDate(startDate: Date, duration: number = 1, unit: string = 'months'): Date {
    const date = new Date(startDate);
    const dayOfMonth = date.getDate();

    if (unit === 'days') {
      date.setDate(date.getDate() + duration);
    } else if (unit === 'weeks') {
      date.setDate(date.getDate() + (duration * 7));
    } else if (unit === 'years') {
      date.setFullYear(date.getFullYear() + duration);
    } else {
      // Default to months
      // Logic for month-end: if we add a month and the resulting month has fewer days,
      // JS naturally overflows. We want to clamp it to the last day of the target month.
      date.setMonth(date.getMonth() + duration);
      
      // Check if we overflowed (e.g. Jan 31 -> March 3)
      if (date.getDate() < dayOfMonth) {
        date.setDate(0); // Set to last day of previous month (which is the target month)
      }
    }
    return date;
  }

  async getActiveSubscriptionsByUserId(
    userId: string
  ): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { user: { id: userId }, status: "active" },
        relations: ["plan"],
        cache: false,
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
          // Try to assigns default free plan on expiry instead of just clearing
          if (sub.user) {
            try {
              const freeSubscription = await this.assignDefaultFreePlan(sub.user.id!);
              if (!freeSubscription) {
                 const { UserService } = await import("./user.service");
                 const userService = new UserService();
                 sub.user.plan = undefined;
                 await userService.updateUser(sub.user.id, sub.user);
              } else {
                 log.info({ userId: sub.user.id }, "Auto-assigned default free plan upon expiration of active subscription");
              }
            } catch (assignError) {
              log.error({ err: assignError, userId: sub.user.id }, "Error auto-assigning free plan, falling back to clearing user plan");
              const { UserService } = await import("./user.service");
              const userService = new UserService();
              sub.user.plan = undefined;
              await userService.updateUser(sub.user.id, sub.user);
            }
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
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'getActiveSubscriptions' } }, 'Error fetching active subscriptions');
      throw new Error("Error fetching active subscriptions");
    }
  }

  /**
   * Internal helper to deactivate all active subscriptions for a user EXCEPT a specific one.
   * This ensures atomicity and prevents multiple concurrent active plans.
   */
  public async deactivateOtherActiveSubscriptions(userId: string, excludeId?: number, manager?: any): Promise<void> {
    try {
      const repo = manager ? manager.getRepository(SubscriptionModel) : this.subscriptionRepo;
      const activeSubs = await repo.find({
        where: { user: { id: userId }, status: "active" },
        cache: false,
      });

      if (activeSubs.length > 0) {
        const toDeactivate = activeSubs.filter((sub: any) => sub.id !== excludeId);
        if (toDeactivate.length > 0) {
          for (const sub of toDeactivate) {
            sub.status = "inactive";
          }
          await repo.save(toDeactivate);
          log.info({ userId, excludeId, deactivatedCount: toDeactivate.length }, "Deactivated other active subscriptions via find/save");
        }
      }
    } catch (error) {
      log.error({ err: error, userId, excludeId }, "Failed to deactivate other active subscriptions");
    }
  }

  /**
   * For existing corrupted data: find all active subscriptions for a user, 
   * keep only the latest one and deactivate others.
   */
  async cleanupDuplicateSubscriptions(userId: string): Promise<void> {
    try {
      const activeSubs = await this.subscriptionRepo.find({
        where: { user: { id: userId }, status: "active" },
        order: { id: "DESC" },
        cache: false,
      });

      if (activeSubs.length > 1) {
        const [latest, ...others] = activeSubs;
        // Keep 'latest', deactivate 'others'
        for (const sub of others) {
          sub.status = "inactive";
        }
        await this.subscriptionRepo.save(others);
        log.info({ userId, cleaned: others.length, keptId: latest.id }, "Cleanup complete: kept latest subscription active");
      }
    } catch (error) {
      log.error({ err: error, userId }, "Failed to cleanup duplicate subscriptions");
    }
  }
}
