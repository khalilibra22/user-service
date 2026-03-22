import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import asyncHandler from "express-async-handler";
import { UserService } from "../services/user.service";
import { UserDto } from "../dtos/user.dto";
import { plainToInstance } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimal-user.dto";
import { AuthMiddleware } from "../utils/auth.middleware";
import { getLogger } from "../utils/logger";

/**
 * Handles admin-only user management: listing all users by role, creating users, and deleting users.
 * Self-service user operations live in UserProfileController.
 */
@injectable()
export class UserAdminController {
  private userService: UserService;

  constructor(@inject(UserService) userService: UserService) {
    this.userService = userService;
  }

  getAllTeachers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { data: teachers, total } = await this.userService.getAllUsers(page, limit, UserRole.TEACHER);
    const dtos = plainToInstance(UserDto, teachers, { excludeExtraneousValues: true });
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());
    res.status(200).json(dtos);
  });

  getAllStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { data: students, total } = await this.userService.getAllUsers(page, limit, UserRole.STUDENT);
    const dtos = plainToInstance(MinimalUserDto, students, { excludeExtraneousValues: true });
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());
    res.status(200).json(dtos);
  });

  getAllAcademies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { data: academies, total } = await this.userService.getAllUsers(page, limit, UserRole.ACADEMY);
    const dtos = plainToInstance(UserDto, academies, { excludeExtraneousValues: true });
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());
    res.status(200).json(dtos);
  });

  getAllAdmins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { data: admins, total } = await this.userService.getAllUsers(page, limit, UserRole.SUPERVISOR);
    const dtos = plainToInstance(MinimalUserDto, admins, { excludeExtraneousValues: true });
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());
    res.status(200).json(dtos);
  });

  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const existing = await this.userService.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "User already exists." });
      return;
    }
    req.body.password = await AuthMiddleware.hashPassword(password);
    const created = await this.userService.createUser(req.body);
    const dto = plainToInstance(UserDto, created, { excludeExtraneousValues: true });
    res.status(201).json(dto);
  });

  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserByIdNoCache(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await this.userService.deleteUser(id);
    res.status(204).json({ message: "User deleted successfully" });
  });
}
