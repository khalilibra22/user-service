import { AppDataSource } from "../config/database";
import { AcademicBackgroundModel } from "../models/academicBackground.model";
import { CategoryModel } from "../models/category.model";
import { SubjectModel } from "../models/subject.model";
import { TopicModel } from "../models/topic.model";
import { UserTopicModel } from "../models/userTopic.model";

export class AcademicBackgroundService {
  academicBackgroundRepo: any;
  categoryRepo: any;
  subjectRepo: any;
  topicRepo: any;
  userTopicRepo: any;

  constructor() {
    this.academicBackgroundRepo = AppDataSource.getRepository(
      AcademicBackgroundModel
    );
    this.categoryRepo = AppDataSource.getRepository(CategoryModel);
    this.subjectRepo = AppDataSource.getRepository(SubjectModel);
    this.topicRepo = AppDataSource.getRepository(TopicModel);
    this.userTopicRepo = AppDataSource.getRepository(UserTopicModel);
  }

  async createAcademicBackground(
    academicBackground: AcademicBackgroundModel
  ): Promise<AcademicBackgroundModel> {
    try {
      return await this.academicBackgroundRepo.save(academicBackground);
    } catch (error) {
      throw new Error("Error creating academic background");
    }
  }

  async getAcademicBackgroundById(
    id: string
  ): Promise<AcademicBackgroundModel | undefined> {
    try {
      return await this.academicBackgroundRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching academic background");
    }
  }

  async getAcademicBackgroundByUserId(
    userId: string
  ): Promise<AcademicBackgroundModel | undefined> {
    try {
      return await this.academicBackgroundRepo.findOne({
        where: {
          userId: userId,
        },
      });
    } catch (error) {
      throw new Error("Error fetching academic background");
    }
  }

  async createCategory(category: CategoryModel): Promise<CategoryModel> {
    try {
      return await this.categoryRepo.save(category);
    } catch (error) {
      throw new Error("Error creating category");
    }
  }

  async createSubject(subject: SubjectModel): Promise<SubjectModel> {
    try {
      return await this.subjectRepo.save(subject);
    } catch (error) {
      throw new Error("Error creating subject");
    }
  }

  async createTopic(topic: TopicModel): Promise<TopicModel> {
    try {
      return await this.topicRepo.save(topic);
    } catch (error) {
      throw new Error("Error creating topic");
    }
  }

  async getCategoryById(id: string): Promise<CategoryModel | undefined> {
    try {
      return await this.categoryRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching category");
    }
  }

  async getSubjectById(id: string): Promise<SubjectModel | undefined> {
    try {
      return await this.subjectRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching subject");
    }
  }

  async getTopicById(id: string): Promise<TopicModel | undefined> {
    try {
      return await this.topicRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching topic");
    }
  }

  async addTopicToUser(
    userTopic: UserTopicModel
  ): Promise<UserTopicModel | undefined> {
    try {
      return await this.userTopicRepo.save(userTopic);
    } catch (error) {
      console.error(error);
      throw new Error("Error adding topic to user");
    }
  }

  async getTopicsByUserId(
    userId: string
  ): Promise<UserTopicModel[] | undefined> {
    try {
      return await this.userTopicRepo.find({
        where: {
          user: {
            id: userId,
          },
        },
        relations: ["topic"],
      });
    } catch (error) {
      throw new Error("Error fetching topics by user id");
    }
  }

  // Get all categories
  async getAllCategories(): Promise<CategoryModel[]> {
    try {
      return await this.categoryRepo.find({
        relations: ["subjects", "subjects.topics"],
      });
    } catch (error) {
      throw new Error("Error fetching categories");
    }
  }
}
