import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserDto } from "../dtos/user.dto";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { getPermission } from "../utils";
import { AcademicBackgroundService } from "../services/academicBackground.service";
import { UserTopicModel } from "../models/userTopic.model";
import { plainToInstance } from "class-transformer";
import { UserTopicDto } from "../dtos/userTopic.dto";
import { PaymentMethodDto } from "../dtos/paymentMethod.dto";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimalUser.dto";

export class UserController {
  private userService: UserService;
  private academicBackgroundService: AcademicBackgroundService;
  constructor() {
    this.userService = new UserService();
    this.academicBackgroundService = new AcademicBackgroundService();
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.USER_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      let userDto;
      if (user.role === UserRole.STUDENT || user.role === UserRole.ADMIN) {
        userDto = plainToInstance(MinimalUserDto, user, {
          excludeExtraneousValues: true,
        });
      } else {
        userDto = plainToInstance(UserDto, user, {
          excludeExtraneousValues: true,
        });
      }
      // const userDto = plainToInstance(UserDto, user, {
      //   excludeExtraneousValues: true,
      // });
      res.status(200).json(userDto);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      // const isPermitted = PermissionMiddleware.checkPermission(
      //   user.role,
      //   Permission.USER_CRUD
      // );
      // if (!isPermitted) {
      //   res.status(403).json({ error: "Unauthorized" });
      //   return;
      // }
      //delete req.body.role;
      const updatedUser = { ...user, ...req.body };
      await this.userService.updateUser(id, updatedUser);
      res.status(200).json({ message: "User updated successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      await this.userService.deleteUser(Number(req.params.id));
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async checkPermissions(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const permissionParam = Number(req.body.permission);
      const permission = getPermission(permissionParam);
      if (!permission) {
        res.status(400).json({ error: "Permission is required" });
        return;
      }
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        permission
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      res.status(200).json({ message: "Authorized" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async addTopicToUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.TEACHER_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const topicId = req.body.topicId;
      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      const userTopic: UserTopicModel = {
        user: user,
        topic: topic,
        price: req.body.price,
      };
      await this.academicBackgroundService.addTopicToUser(userTopic);
      res.status(200).json({ message: "Topic added to user successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getTopicsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.TEACHER_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const topics = await this.academicBackgroundService.getTopicsByUserId(id);
      const topicDtos = plainToInstance(UserTopicDto, topics, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(topicDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Get user plan
  async getUserPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
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
      const userPlan = await this.userService.getUserPlan(id);
      res.status(200).json(userPlan?.plan);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  // Add payemnt method
  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.PAYMENT_METHOD_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const paymentMethodBody = { ...req.body, user: user };
      const payementMethod = await this.userService.addPaymentMethod(
        paymentMethodBody
      );
      const paymentMethodDto = plainToInstance(
        PaymentMethodDto,
        payementMethod,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(paymentMethodDto);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  //Update payment method
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.PAYMENT_METHOD_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const paymentMethodId = req.params.paymentMethodId;
      const paymentMethod = await this.userService.getPaymentMethodById(
        paymentMethodId
      );
      if (!paymentMethod) {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      const paymentMethodBody = {
        ...req.body,
        id: paymentMethodId,
        user: user,
      };
      await this.userService.updatePaymentMethod(paymentMethodBody);
      res.status(200).json({ message: "Payment method updated successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (error.message === "Error fetching payment method") {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Get payment methods by user id
  async getPaymentMethodsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.PAYMENT_METHOD_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const paymentMethods = await this.userService.getPaymentMethodsByUserId(
        id
      );
      const paymentMethodDtos = plainToInstance(
        PaymentMethodDto,
        paymentMethods,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(paymentMethodDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
