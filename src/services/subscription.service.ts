import { LessThan, MoreThan } from "typeorm";
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
      return await this.subscriptionRepo.save(subscription);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'createSubscription' } }, 'Error creating subscription');
      throw new Error("Error creating subscription");
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
        const durationInMonths = this.getDurationInMonths(subscription.plan.duration, subscription.plan.durationUnit);
        subscription.endDate = new Date(now);
        subscription.endDate.setMonth(now.getMonth() + durationInMonths);
      }

      const updatedSubscription = await this.subscriptionRepo.save(subscription);

      // Update user plan
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
      const subscription = await this.subscriptionRepo.findOne({ where: { id: subscriptionId } });
      if (!subscription) throw new Error("Subscription not found");

      subscription.status = "inactive";
      return await this.subscriptionRepo.save(subscription);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'deactivateSubscription', subscriptionId } }, 'Error deactivating subscription');
      throw new Error("Error deactivating subscription");
    }
  }

  private getDurationInMonths(duration: number = 1, unit: string = 'months'): number {
    return unit === 'years' ? duration * 12 : duration;
  }

  async getActiveSubscriptionsByUserId(
    userId: string
  ): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { user: { id: userId }, isActive: true },
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

  async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date();

      const expiredSubscriptions = await this.subscriptionRepo.find({
        where: {
          status: "active",
          endDate: LessThan(now),
        },
      });

      if (expiredSubscriptions.length > 0) {
        // Update status of expired subscriptions
        for (const sub of expiredSubscriptions) {
          sub.status = "inactive";
        }
        await this.subscriptionRepo.save(expiredSubscriptions);
      }
    } catch (error) {
      log.error({ err: error, ctx: { service: 'SubscriptionService', op: 'checkExpiredSubscriptions' } }, 'Error checking expired subscriptions');
      throw new Error("Error checking expired subscriptions");
    }
  }

  //Get all active subscriptions
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
