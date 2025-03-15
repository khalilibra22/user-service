import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserDto } from "../dto/user.dto";
import { PermissionService } from "../services/permission.service";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";

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
      console.log(isPermitted);
      res.status(200).json(new UserDto(user));
    } catch (error) {
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

  //   async getPermissions(req: Request, res: Response): Promise<void> {
  //     try {
  //       const id = req.params.id;
  //       const user = await this.userService.getPermissions(id);
  //       if (!user) {
  //         res.status(404).json({ error: "User not found" });
  //         return;
  //       }
  //       res.status(200).json(user.permissions);
  //     } catch (error) {
  //       res.status(500).json({ error: "Internal Server Error" });
  //     }
  //   }

  //add permissions to user
  //   async addPermission(req: Request, res: Response): Promise<void> {
  //     try {
  //       const id = req.params.id;
  //       const user = await this.userService.getUserById(id);
  //       if (!user) {
  //         res.status(404).json({ error: "User not found" });
  //         return;
  //       }
  //       const permissionId = Number(req.body.permissionId);
  //       const permission = await this.permissionService.getPermissionById(
  //         permissionId
  //       );
  //       if (!permission) {
  //         res.status(404).json({ error: "Permission not found" });
  //         return;
  //       }
  //       if (user.permissions === undefined) {
  //         user.permissions = [];
  //       }
  //       user.permissions.push(permission);
  //       await this.userService.addPermission(user);
  //       res.status(200).json({ message: "Permission added successfully" });
  //     } catch (error) {
  //       res.status(500).json({ error: "Internal Server Error" });
  //     }
  //   }
}
