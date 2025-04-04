import { UserModel } from "../models/user.model";
import { AppDataSource } from "../config/database";

export class UserService {
  userRepo: any;
  constructor() {
    this.userRepo = AppDataSource.getRepository(UserModel);
  }

  async createUser(user: UserModel): Promise<UserModel> {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      throw new Error("Error creating user");
    }
  }

  async getUserById(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
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

  async deleteUser(id: number): Promise<void> {
    await this.userRepo.delete(UserModel, id);
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
      AppDataSource.manager.save(user);
    } catch (error) {
      throw new Error("Error adding permission to user");
    }
  }
}
