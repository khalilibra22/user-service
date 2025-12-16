import { Request, Response } from "express";
import { AcademicBackgroundService } from "../services/academic-background.service";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { AcademicBackgroundDto } from "../dtos/academic-background.dto";
import { CategoryDto } from "../dtos/category.dto";
import { TopicDto } from "../dtos/topic.dto";
import { UserTopicDto } from "../dtos/user-topic.dto";
import { getLogger } from "../utils/logger";

export class AcademicBackgroundController {
  private academicBackgroundService: AcademicBackgroundService;
  private userService: UserService;
  constructor() {
    this.academicBackgroundService = new AcademicBackgroundService();
    this.userService = new UserService();
  }

  createAcademicBackground = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = req.body;
      const createdCategory =
        await this.academicBackgroundService.createCategory(category);
      const categoryDto = plainToInstance(CategoryDto, createdCategory, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(categoryDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const subject = req.body;
      const categoryId = req.params.categoryId;
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
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      const topic = req.body;
      const categoryId = req.params.categoryId;
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
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories =
        await this.academicBackgroundService.getAllCategories();
      const categoriesDto = plainToInstance(CategoryDto, categories, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(categoriesDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //update academic background
  updateAcademicBackground = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get academic background by user ID
  getAcademicBackgroundByUserId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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

      // Group DTOs by type
      const groupedByType = academicBackgroundDtos.reduce(
        (acc: any, dto: any) => {
          const type = dto.type || "other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(dto);
          return acc;
        },
        {}
      );

      res.status(200).json(groupedByType);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error fetching academic backgrounds');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      const topicId = Number(req.params.topicId);
      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }
      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      await this.academicBackgroundService.deleteTopic(topicId);
      res.status(204).json({ message: "Topic deleted successfully" });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      const topicId = Number(req.params.topicId);
      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }
      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      const topicData = { ...topic, ...req.body };
      await this.academicBackgroundService.updateTopic(topicData);
      res.status(200).json({
        message: "Topic updated successfully",
      });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  toggleTopicStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const topicId = Number(req.params.topicId);
      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }
      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      topic.isActive = !topic.isActive; // Toggle the status
      await this.academicBackgroundService.updateTopic(topic);

      res.status(200).json({
        message: `Topic status updated to ${topic.isActive ? "active" : "inactive"
          }`,
      });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteAcademicBackground = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.params.id;
      const academicBackgroundId = Number(req.params.academicBackgroundId);

      if (isNaN(academicBackgroundId)) {
        res.status(400).json({ error: "Invalid academic background ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const academicBackground =
        await this.academicBackgroundService.getAcademicBackgroundById(
          academicBackgroundId
        );
      if (!academicBackground) {
        res.status(404).json({ error: "Academic background not found" });
        return;
      }

      await this.academicBackgroundService.deleteAcademicBackground(
        academicBackgroundId
      );
      res
        .status(204)
        .json({ message: "Academic background deleted successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  addTopicToUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const topicId = Number(req.params.topicId);

      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const existingUserTopic =
        await this.academicBackgroundService.getUserTopicByUserIdAndTopicId(
          userId,
          topicId
        );
      if (existingUserTopic) {
        res.status(409).json({ error: "Topic already added to user" });
        return;
      }

      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      const userTopic = {
        user: user,
        topic: topic,
        price: req.body.price,
      };
      await this.academicBackgroundService.addTopicToUser(userTopic);
      res.status(200).json({ message: "Topic added to user successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateUserTopicPrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const topicId = Number(req.params.topicId);

      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userTopic =
        await this.academicBackgroundService.getUserTopicByUserIdAndTopicId(
          userId,
          topicId
        );
      if (!userTopic) {
        res.status(404).json({ error: "Topic not assigned to this user" });
        return;
      }
      userTopic.price = req.body.price;
      await this.academicBackgroundService.updateUserTopic(userTopic);
      res
        .status(200)
        .json({ message: "User topic price updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteUserTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const topicId = Number(req.params.topicId);

      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userTopic =
        await this.academicBackgroundService.getUserTopicByUserIdAndTopicId(
          userId,
          topicId
        );
      if (!userTopic) {
        res.status(404).json({ error: "Topic not assigned to this user" });
        return;
      }

      await this.academicBackgroundService.deleteUserTopic(
        Number(userTopic.id)
      );
      res.status(204).json({ message: "User topic deleted successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getTopicsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const topics = await this.academicBackgroundService.getTopicsByUserId(id);
      const topicDtos = plainToInstance(UserTopicDto, topics, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(topicDtos);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  toggleUserTopicStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.params.id;
      const topicId = Number(req.params.topicId);

      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userTopic =
        await this.academicBackgroundService.getUserTopicByUserIdAndTopicId(
          userId,
          topicId
        );
      if (!userTopic) {
        res.status(404).json({ error: "Topic not assigned to this user" });
        return;
      }

      userTopic.isActive = !userTopic.isActive;
      await this.academicBackgroundService.updateUserTopic(userTopic);

      res.status(200).json({
        message: `User topic status updated to ${userTopic.isActive ? "active" : "inactive"
          }`,
      });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getTopicById = async (req: Request, res: Response): Promise<void> => {
    try {
      const topicId = Number(req.params.id);
      if (isNaN(topicId)) {
        res.status(400).json({ error: "Invalid topic ID" });
        return;
      }

      const topic = await this.academicBackgroundService.getTopicById(topicId);
      if (!topic) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }

      const topicDto = plainToInstance(TopicDto, topic, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(topicDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error fetching topic');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUserTopicById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const userTopic = await this.academicBackgroundService.getUserTopicById(
        id
      );
      if (!userTopic) {
        res.status(404).json({ error: "User topic not found" });
        return;
      }
      const userTopicDto = plainToInstance(UserTopicDto, userTopic, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(userTopicDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in academic background operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
