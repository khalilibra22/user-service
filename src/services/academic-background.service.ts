import { AppDataSource } from "../config/database";
import { AcademicBackgroundModel } from "../models/academic-background.model";
import { CategoryModel } from "../models/category.model";
import { SubjectModel } from "../models/subject.model";
import { TopicModel } from "../models/topic.model";
import { UserTopicModel } from "../models/user-topic.model";
import { getLogger } from "../utils/logger";

const log = getLogger();

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
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'createAcademicBackground' } }, 'Error creating academic background');
      throw new Error("Error creating academic background");
    }
  }

  async updateAcademicBackground(
    academicBackground: AcademicBackgroundModel
  ): Promise<void> {
    try {
      return await this.academicBackgroundRepo.save(academicBackground);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'updateAcademicBackground' } }, 'Error updating academic background');
      throw new Error("Error updating academic background");
    }
  }

  async getAcademicBackgroundById(
    id: number
  ): Promise<AcademicBackgroundModel | undefined> {
    try {
      return await this.academicBackgroundRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getAcademicBackgroundById', id } }, 'Error fetching academic background');
      throw new Error("Error fetching academic background");
    }
  }

  async createCategory(category: CategoryModel): Promise<CategoryModel> {
    try {
      const saved = await this.categoryRepo.save(category);
      // Invalidate the shared categories cache so the new category is visible immediately
      await AppDataSource.queryResultCache?.remove(['all_categories']);
      return saved;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'createCategory' } }, 'Error creating category');
      throw new Error("Error creating category");
    }
  }

  async createSubject(subject: SubjectModel): Promise<SubjectModel> {
    try {
      const saved = await this.subjectRepo.save(subject);
      await AppDataSource.queryResultCache?.remove(['all_categories']);
      return saved;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'createSubject' } }, 'Error creating subject');
      throw new Error("Error creating subject");
    }
  }

  async createTopic(topic: TopicModel): Promise<TopicModel> {
    try {
      const saved = await this.topicRepo.save(topic);
      await AppDataSource.queryResultCache?.remove(['all_categories']);
      return saved;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'createTopic' } }, 'Error creating topic');
      throw new Error("Error creating topic");
    }
  }

  async getCategoryById(id: string): Promise<CategoryModel | undefined> {
    try {
      return await this.categoryRepo.findOne({
        where: {
          id: id,
        },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getCategoryById', categoryId: id } }, 'Error fetching category');
      throw new Error("Error fetching category");
    }
  }

  async getSubjectById(id: string): Promise<SubjectModel | undefined> {
    try {
      return await this.subjectRepo.findOne({
        where: {
          id: id,
        },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getSubjectById', subjectId: id } }, 'Error fetching subject');
      throw new Error("Error fetching subject");
    }
  }

  async getTopicById(id: number): Promise<TopicModel | undefined> {
    try {
      return await this.topicRepo.findOne({
        where: {
          id: id,
        },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getTopicById', topicId: id } }, 'Error fetching topic');
      throw new Error("Error fetching topic");
    }
  }

  async addTopicToUser(
    userTopic: UserTopicModel
  ): Promise<UserTopicModel | undefined> {
    try {
      return await this.userTopicRepo.save(userTopic);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'addTopicToUser' } }, 'Error adding topic to user');
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
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getTopicsByUserId', userId } }, 'Error fetching topics by user id');
      throw new Error("Error fetching topics by user id");
    }
  }

  // Get all categories
  async getAllCategories(): Promise<CategoryModel[]> {
    try {
      return await this.categoryRepo.find({
        relations: ["subjects", "subjects.topics"],
        // ✅ CACHED — admin-only writes, read by every user on the platform.
        // Invalidated on createCategory / createSubject / createTopic / updateTopic / deleteTopic.
        cache: {
          id: 'all_categories',
          milliseconds: 3600000, // 1 hour
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getAllCategories' } }, 'Error fetching categories');
      throw new Error("Error fetching categories");
    }
  }

  //Get academic backgrounds by user id
  async getAcademicBackgroundsByUserId(
    userId: string
  ): Promise<AcademicBackgroundModel[] | undefined> {
    try {
      return await this.academicBackgroundRepo.find({
        where: {
          user: {
            id: userId,
          },
        },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getAcademicBackgroundsByUserId', userId } }, 'Error fetching academic backgrounds by user id');
      throw new Error("Error fetching academic backgrounds by user id");
    }
  }
  async deleteTopic(id: number): Promise<void> {
    try {
      await this.topicRepo.softDelete(id);
      await AppDataSource.queryResultCache?.remove(['all_categories']);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'deleteTopic', topicId: id } }, 'Error deleting topic');
      throw new Error("Error deleting topic");
    }
  }

  async updateTopic(topic: TopicModel): Promise<void> {
    try {
      await this.topicRepo.save(topic);
      // Bust the categories cache so updated topic names are reflected
      await AppDataSource.queryResultCache?.remove(['all_categories']);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'updateTopic' } }, 'Error updating topic');
      throw new Error("Error updating topic");
    }
  }

  async deleteAcademicBackground(id: number): Promise<void> {
    try {
      await this.academicBackgroundRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'deleteAcademicBackground', academicBackgroundId: id } }, 'Error deleting academic background');
      throw new Error("Error deleting academic background");
    }
  }

  async getUserTopicByUserIdAndTopicId(
    userId: string,
    topicId: number
  ): Promise<UserTopicModel | undefined> {
    try {
      return await this.userTopicRepo.findOne({
        where: {
          user: {
            id: userId,
          },
          topic: {
            id: topicId,
          },
        },
        //relations: ["topic", "user"],
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getUserTopicByUserIdAndTopicId', userId, topicId } }, 'Error fetching user topic by user id and topic id');
      throw new Error("Error fetching user topic by user id and topic id");
    }
  }

  async updateUserTopic(userTopic: UserTopicModel): Promise<void> {
    try {
      await this.userTopicRepo.save(userTopic);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'updateUserTopic' } }, 'Error updating user topic');
      throw new Error("Error updating user topic");
    }
  }

  async deleteUserTopic(id: number): Promise<void> {
    try {
      await this.userTopicRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'deleteUserTopic', userTopicId: id } }, 'Error deleting user topic');
      throw new Error("Error deleting user topic");
    }
  }

  async getUserTopicById(id: number): Promise<UserTopicModel | undefined> {
    try {
      return await this.userTopicRepo.findOne({
        where: {
          id: id,
        },
        relations: ["topic"],
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AcademicBackgroundService', op: 'getUserTopicById', userTopicId: id } }, 'Error fetching user topic by id');
      throw new Error("Error fetching user topic by id");
    }
  }
}
