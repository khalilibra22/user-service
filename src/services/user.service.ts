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

  async getUserById(id: number): Promise<UserModel | undefined> {
    return await this.userRepo.findOne(UserModel, id);
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

  async updateUser(id: number, user: UserModel): Promise<UserModel> {
    await await this.userRepo.update(UserModel, id, user);
    return await this.userRepo.findOne(UserModel, id);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepo.delete(UserModel, id);
  }
}
