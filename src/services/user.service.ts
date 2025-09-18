import { UserModel } from "../models/user.model";
import { AppDataSource } from "../config/database";
import { PaymentMethodModel } from "../models/payment-method.model";
import { UserRole } from "../enums/userRoles.enum";
import { UserSettingModel } from "../models/user-setting.model";
import { In } from "typeorm";

export class UserService {
  userRepo: any;
  payementMethodRepo: any;
  userSettingRepo: any;
  constructor() {
    this.userRepo = AppDataSource.getRepository(UserModel);
    this.payementMethodRepo = AppDataSource.getRepository(PaymentMethodModel);
    this.userSettingRepo = AppDataSource.getRepository(UserSettingModel);
  }

  async createUser(user: UserModel): Promise<UserModel> {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating user");
    }
  }

  async createUserSetting(
    userSetting: UserSettingModel
  ): Promise<UserSettingModel> {
    try {
      return await this.userSettingRepo.save(userSetting);
    } catch (error) {
      throw new Error("Error creating user setting");
    }
  }

  async getUserById(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["settings"],
      });
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  async getUserByEmail(email: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          email: email,
        },
      });
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  async updateUser(id: string, user: UserModel): Promise<void> {
    try {
      await await this.userRepo.save(user);
    } catch (error) {
      throw new Error("Error updating user");
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepo.softDelete(id);
    } catch (error) {
      throw new Error("Error deleting user");
    }
  }

  async getPermissions(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["permissions"],
      });
    } catch (error) {
      throw new Error("Error fetching user permissions");
    }
  }

  async addPermission(user: UserModel): Promise<void> {
    try {
      await AppDataSource.manager.save(user);
    } catch (error) {
      throw new Error("Error adding permission to user");
    }
  }

  // Get user plan
  async getUserPlan(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["plan"],
      });
    } catch (error) {
      throw new Error("Error fetching user plan");
    }
  }

  // Add payement method to user
  async addPaymentMethod(
    paymentMethod: PaymentMethodModel
  ): Promise<PaymentMethodModel> {
    try {
      const newPaymentMethod = await this.payementMethodRepo.save(
        paymentMethod
      );
      return newPaymentMethod;
    } catch (error) {
      throw new Error("Error adding payment method to user");
    }
  }

  // Update payment method
  async updatePaymentMethod(paymentMethod: PaymentMethodModel): Promise<void> {
    try {
      await this.payementMethodRepo.save(paymentMethod);
    } catch (error) {
      throw new Error("Error updating payment method");
    }
  }

  // Get payment methods by user id
  async getPaymentMethodsByUserId(
    userId: string
  ): Promise<PaymentMethodModel[]> {
    try {
      return await this.payementMethodRepo.find({
        where: {
          user: {
            id: userId,
          },
        },
      });
    } catch (error) {
      throw new Error("Error fetching payment methods");
    }
  }

  //getPaymentMethodById
  async getPaymentMethodById(
    id: string
  ): Promise<PaymentMethodModel | undefined> {
    try {
      return await this.payementMethodRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching payment method");
    }
  }

  // Get payment method by type
  async getPaymentMethodByTypeAndUserId(
    type: string,
    userId: string
  ): Promise<PaymentMethodModel | undefined> {
    try {
      return await this.payementMethodRepo.findOne({
        where: {
          type: type,
          user: {
            id: userId,
          },
        },
      });
    } catch (error) {
      throw new Error("Error fetching payment method by type and user ID");
    }
  }

  // Delete payment method softly
  async deletePaymentMethod(id: string): Promise<void> {
    try {
      await this.payementMethodRepo.softDelete(id);
    } catch (error) {
      throw new Error("Error deleting payment method");
    }
  }

  // get user by googleId
  async getUserByGoogleId(googleId: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          googleId: googleId,
        },
      });
    } catch (error) {
      throw new Error("Error fetching user by Google ID");
    }
  }

  async getAllUsers(
    page: number,
    limit: number,
    role: UserRole
  ): Promise<UserModel[]> {
    try {
      return await this.userRepo.find({
        where: {
          role: role,
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new Error("Error fetching users");
    }
  }

  async searchTeachersAndAcademies(
    page: number,
    limit: number
  ): Promise<UserModel[]> {
    try {
      return await this.userRepo.find({
        where: {
          role: In([UserRole.TEACHER, UserRole.ACADEMY]),
          topics: {
            isActive: true,
            topic: {
              isActive: true,
            },
          },
        },
        relations: ["topics", "topics.topic", "availabilities"],
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new Error("Error searching teachers and academies");
    }
  }
}
