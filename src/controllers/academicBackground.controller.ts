import { Request, Response } from "express";
import { PermissionMiddleware } from "../utils/permission.middleware";
import { Permission } from "../enums/permission.enum";
import { AcademicBackgroundService } from "../services/academicBackground.service";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { AcademicBackgroundDto } from "../dtos/AcademicBackground.dto";
import { CategoryDto } from "../dtos/category.dto";
import { TopicDto } from "../dtos/topic.dto";

export class AcademicBackgroundController {
  private academicBackgroundService: AcademicBackgroundService;
  private userService: UserService;
  constructor() {
    this.academicBackgroundService = new AcademicBackgroundService();
    this.userService = new UserService();
  }

  async createAcademicBackground(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const academicBackground = req.body;
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
      const categoryId = req.params.id;
      const category = await this.academicBackgroundService.getCategoryById(
        categoryId
      );
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
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
      const categoryId = req.params.id;
      const subjectId = req.params.subjectId;
      const category = await this.academicBackgroundService.getCategoryById(
        categoryId
      );
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      const subject = await this.academicBackgroundService.getSubjectById(
        subjectId
      );
      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }
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

  //update academic background
  async updateAcademicBackground(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const id = Number(req.params.academicBackgroundId);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid academic background ID" });
        return;
      }
      const academicBackground =
        await this.academicBackgroundService.getAcademicBackgroundById(id);
      if (!academicBackground) {
        res.status(404).json({ error: "Academic background not found" });
        return;
      }
      const academicBackgroundData = req.body;
      await this.academicBackgroundService.updateAcademicBackground(
        academicBackgroundData
      );
      res
        .status(200)
        .json({ message: "Academic background updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get academic background by user ID
  async getAcademicBackgroundByUserId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const academicBackgrounds =
        await this.academicBackgroundService.getAcademicBackgroundsByUserId(
          userId
        );
      if (!academicBackgrounds) {
        res.status(404).json({ error: "Academic background not found" });
        return;
      }
      const academicBackgroundDtos = plainToInstance(
        AcademicBackgroundDto,
        academicBackgrounds,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(academicBackgroundDtos);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
