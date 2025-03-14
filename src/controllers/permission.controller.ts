import { Request, Response } from "express";
import { PermissionService } from "../services/permission.service";

export class PermissionController {
  private permissionService: PermissionService;
  constructor() {
    this.permissionService = new PermissionService();
  }

  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const permission = await this.permissionService.createPermission(
        req.body
      );
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const permission = await this.permissionService.getPermissionById(id);
      if (!permission) {
        res.status(404).json({ error: "Permission not found" });
        return;
      }
      res.status(200).json(permission);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
