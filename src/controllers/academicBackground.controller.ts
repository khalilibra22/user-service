import { Request, Response } from "express";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { AcademicBackgroundService } from "../services/academicBackground.service";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { AcademicBackgroundDto } from "../dto/AcademicBackground.dto";
import { CategoryDto } from "../dto/category.dto";
import { TopicDto } from "../dto/topic.dto";

export class AcademicBackgroundController {
  private academicBackgroundService: AcademicBackgroundService;
  private userService: UserService;
  constructor() {
    this.academicBackgroundService = new AcademicBackgroundService();
    this.userService = new UserService();
  }

  async createAcademicBackground(req: Request, res: Response): Promise<void> {
    try {
      const academicBackground = req.body;
      const { userId } = req.body;
      const user = await this.userService.getUserById(userId);
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

      delete academicBackground.userId;
      academicBackground.user = user;
      const createdAcademicBackground =
        await this.academicBackgroundService.createAcademicBackground(
          academicBackground
        );
      const academicBackgroundDto = plainToInstance(
        AcademicBackgroundDto,
        createdAcademicBackground,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(academicBackgroundDto);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = req.body;
      const createdCategory =
        await this.academicBackgroundService.createCategory(category);
      const categoryDto = plainToInstance(CategoryDto, createdCategory, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(categoryDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createSubject(req: Request, res: Response): Promise<void> {
    try {
      const subject = req.body;
      const { categoryId } = req.body;
      const category = await this.academicBackgroundService.getCategoryById(
        categoryId
      );
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      delete subject.categoryId;
      subject.category = category;
      const createdSubject = await this.academicBackgroundService.createSubject(
        subject
      );
      const subjectDto = plainToInstance(CategoryDto, createdSubject, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(subjectDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const topic = req.body;
      const { subjectId } = req.body;
      const subject = await this.academicBackgroundService.getSubjectById(
        subjectId
      );
      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }
      delete topic.subjectId;
      topic.subject = subject;
      const createdTopic = await this.academicBackgroundService.createTopic(
        topic
      );
      const topicDto = plainToInstance(TopicDto, createdTopic, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(topicDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories =
        await this.academicBackgroundService.getAllCategories();
      const categoriesDto = plainToInstance(CategoryDto, categories, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(categoriesDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
