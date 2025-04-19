import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { SubscriptionService } from "../services/subscription.service";
import { getDurationInMonths } from "../utils";
import { plainToInstance } from "class-transformer";
import { PlanDto } from "../dtos/plan.dto";
import { SubscriptionDto } from "../dtos/subscription.dto";

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
      const planDto = plainToInstance(PlanDto, plan, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(planDto);
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
      const subscriptionDto = plainToInstance(SubscriptionDto, subscription, {
        excludeExtraneousValues: true,
      });
      user.plan = plan;
      await this.userService.updateUser(userId, user);
      res.status(201).json(subscriptionDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await this.subscriptionService.getPlans();
      const planDtos = plainToInstance(PlanDto, plans, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(planDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getActiveSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const subscriptions =
        await this.subscriptionService.getActiveSubscriptions();
      const subscriptionDtos = plainToInstance(SubscriptionDto, subscriptions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(subscriptionDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
