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
      return await this.planRepo.findOne({ where: { id: planId } });
    } catch (error) {
      throw new Error("Error fetching plan");
    }
  }

  async getPlans(): Promise<PlanModel[]> {
    try {
      return await this.planRepo.find();
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
      });
    } catch (error) {
      throw new Error("Error fetching active subscriptions");
    }
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    const expiredSubscriptions = await this.subscriptionRepo.find({
      where: {
        status: "active",
        endDate: LessThan(now),
      },
    });

    if (expiredSubscriptions.length > 0) {
      console.log(
        `Found ${expiredSubscriptions.length} expired subscriptions:`
      );
      expiredSubscriptions.forEach((sub: any) => {
        console.log(
          `Subscription ID: ${sub.id}, User ID: ${sub.user?.id}, End Date: ${sub.endDate}`
        );
      });

      // Update status of expired subscriptions
      for (const sub of expiredSubscriptions) {
        sub.status = "inactive";
      }

      await this.subscriptionRepo.save(expiredSubscriptions);
      console.log("Expired subscriptions updated.");
    } else {
      console.log("No expired subscriptions found.");
    }
  }

  //Get all active subscriptions
  async getActiveSubscriptions(): Promise<SubscriptionModel[]> {
    try {
      return await this.subscriptionRepo.find({
        where: { status: "active" },
        relations: ["user", "plan"],
      });
    } catch (error) {
      throw new Error("Error fetching active subscriptions");
    }
  }
}
