import { AppDataSource } from "../config/database";
import { AcademicBackgroundModel } from "../models/academicBackground.model";
import { CategoryModel } from "../models/category.model";
import { SubjectModel } from "../models/subject.model";
import { TopicModel } from "../models/topic.model";

export class AcademicBackgroundService {
  academicBackgroundRepo: any;
  categoryRepo: any;
  subjectRepo: any;
  topicRepo: any;

  constructor() {
    this.academicBackgroundRepo = AppDataSource.getRepository(
      AcademicBackgroundModel
    );
    this.categoryRepo = AppDataSource.getRepository(CategoryModel);
    this.subjectRepo = AppDataSource.getRepository(SubjectModel);
    this.topicRepo = AppDataSource.getRepository(TopicModel);
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
}
