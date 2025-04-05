import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { SubscriptionService } from "../services/subscription.service";
import { getDurationInMonths } from "../utils";

export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private userService: UserService;
  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.userService = new UserService();
  }

  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await this.subscriptionService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.SUBSCRIPTION
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const planId = req.params.planId;
      const plan = await this.subscriptionService.getPlanById(planId);
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      const durationInMonths = getDurationInMonths(
        plan.duration,
        plan.durationUnit
      );
      const subscriptionBody = {
        startDate: new Date(),
        endDate: new Date(
          new Date(
            new Date().setMonth(new Date().getMonth() + durationInMonths)
          )
        ),
        plan: plan,
        user: user,
      };
      const subscription = await this.subscriptionService.createSubscription(
        subscriptionBody
      );
      user.plan = plan;
      await this.userService.updateUser(userId, user);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await this.subscriptionService.getPlans();
      res.status(200).json(plans);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
