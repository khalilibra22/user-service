import { LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../config/database";
import { PlanModel } from "../models/plan.model";
import { SubscriptionModel } from "../models/subscription.model";

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
      throw new Error("Error fetching plans");
    }
  }

  async createSubscription(
    subscription: SubscriptionModel
  ): Promise<SubscriptionModel> {
    try {
      return await this.subscriptionRepo.save(subscription);
    } catch (error) {
      throw new Error("Error creating subscription");
    }
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
      throw new Error("Error fetching active subscriptions");
    }
  }
}
