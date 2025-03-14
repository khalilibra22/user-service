import { AppDataSource } from "../config/database";
import { PermissionModel } from "../models/permission.model";

export class PermissionService {
  permissionRepo: any;
  constructor() {
    this.permissionRepo = AppDataSource.getRepository(PermissionModel);
  }

  async createPermission(
    permission: PermissionModel
  ): Promise<PermissionModel> {
    try {
      return await this.permissionRepo.save(permission);
    } catch (error) {
      throw new Error("Error creating permission");
    }
  }

  async getPermissionById(id: number): Promise<PermissionModel | undefined> {
    try {
      return await this.permissionRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching permission");
    }
  }
}
