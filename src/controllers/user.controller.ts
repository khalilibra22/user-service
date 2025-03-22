import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserDto } from "../dto/user.dto";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { getPermission } from "../utils";

export class UserController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
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
      res.status(200).json(new UserDto(user));
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
      const isPermitted = PermissionMiddleware.checkPermission(
        user.role,
        Permission.USER_CRUD
      );
      if (!isPermitted) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const updatedUser = { ...user, ...req.body };
      await this.userService.updateUser(id, updatedUser);
      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
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
}
