import { UserModel } from "../models/user.model";
import { AppDataSource } from "../config/database";
import { PaymentMethodModel } from "../models/payment-method.model";
import { UserRole } from "../enums/userRoles.enum";
import { UserSettingModel } from "../models/user-setting.model";
import { In, Brackets, WhereExpressionBuilder } from "typeorm";
import { getLogger } from "../utils/logger";
import { ChatService } from "./chat.service";

const log = getLogger();

export class UserService {
  userRepo: any;
  payementMethodRepo: any;
  userSettingRepo: any;
  chatService: ChatService;
  constructor() {
    this.userRepo = AppDataSource.getRepository(UserModel);
    this.payementMethodRepo = AppDataSource.getRepository(PaymentMethodModel);
    this.userSettingRepo = AppDataSource.getRepository(UserSettingModel);
    this.chatService = new ChatService();
  }

  async createUser(user: UserModel): Promise<UserModel> {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'createUser' } }, 'Error creating user');
      throw new Error("Error creating user");
    }
  }

  async createUserSetting(
    userSetting: UserSettingModel
  ): Promise<UserSettingModel> {
    try {
      return await this.userSettingRepo.save(userSetting);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'createUserSetting' } }, 'Error creating user setting');
      throw new Error("Error creating user setting");
    }
  }

  async getUserById(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["settings"],
        cache: {
          id: `user_${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getUserById', userId: id } }, 'Error fetching user');
      throw new Error("Error fetching user");
    }
  }

  async getUserByIdNoCache(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["settings"],
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getUserByIdNoCache', userId: id } }, 'Error fetching user');
      throw new Error("Error fetching user");
    }
  }

  async getUserByEmail(email: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          email: email,
        },
        cache: false,
        // cache: {
        //   id: `user_email_${email}`,
        //   milliseconds: 300000, // 5 minutes
        // },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getUserByEmail', email } }, 'Error fetching user');
      throw new Error("Error fetching user");
    }
  }

  async updateUser(id: string, user: UserModel): Promise<void> {
    try {
      await await this.userRepo.save(user);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'updateUser', userId: id } }, 'Error updating user');
      throw new Error("Error updating user");
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'deleteUser', userId: id } }, 'Error deleting user');
      throw new Error("Error deleting user");
    }
  }

  async getPermissions(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["permissions"],
        cache: {
          id: `user_permissions_${id}`,
          milliseconds: 600000, // 10 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getPermissions', userId: id } }, 'Error fetching user permissions');
      throw new Error("Error fetching user permissions");
    }
  }

  async addPermission(user: UserModel): Promise<void> {
    try {
      await AppDataSource.manager.save(user);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'addPermission', userId: user.id } }, 'Error adding permission to user');
      throw new Error("Error adding permission to user");
    }
  }

  // Get user plan
  async getUserPlan(id: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          id: id,
        },
        relations: ["plan"],
        cache: {
          id: `user_plan_${id}`,
          milliseconds: 900000, // 15 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getUserPlan', userId: id } }, 'Error fetching user plan');
      throw new Error("Error fetching user plan");
    }
  }

  // Add payement method to user
  async addPaymentMethod(
    paymentMethod: PaymentMethodModel
  ): Promise<PaymentMethodModel> {
    try {
      const newPaymentMethod = await this.payementMethodRepo.save(
        paymentMethod
      );
      return newPaymentMethod;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'addPaymentMethod' } }, 'Error adding payment method to user');
      throw new Error("Error adding payment method to user");
    }
  }

  // Update payment method
  async updatePaymentMethod(paymentMethod: PaymentMethodModel): Promise<void> {
    try {
      await this.payementMethodRepo.save(paymentMethod);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'updatePaymentMethod' } }, 'Error updating payment method');
      throw new Error("Error updating payment method");
    }
  }

  // Get payment methods by user id
  async getPaymentMethodsByUserId(
    userId: string
  ): Promise<PaymentMethodModel[]> {
    try {
      return await this.payementMethodRepo.find({
        where: {
          user: {
            id: userId,
          },
        },
        cache: {
          id: `payment_methods_${userId}`,
          milliseconds: 180000, // 3 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getPaymentMethodsByUserId', userId } }, 'Error fetching payment methods');
      throw new Error("Error fetching payment methods");
    }
  }

  //getPaymentMethodById
  async getPaymentMethodById(
    id: string
  ): Promise<PaymentMethodModel | undefined> {
    try {
      return await this.payementMethodRepo.findOne({
        where: {
          id: id,
        },
        cache: {
          id: `payment_method_${id}`,
          milliseconds: 180000, // 3 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getPaymentMethodById', paymentMethodId: id } }, 'Error fetching payment method');
      throw new Error("Error fetching payment method");
    }
  }

  // Get payment method by type
  async getPaymentMethodByTypeAndUserId(
    type: string,
    userId: string
  ): Promise<PaymentMethodModel | undefined> {
    try {
      return await this.payementMethodRepo.findOne({
        where: {
          type: type,
          user: {
            id: userId,
          },
        },
        cache: {
          id: `payment_method_${type}_${userId}`,
          milliseconds: 180000, // 3 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getPaymentMethodByTypeAndUserId', type, userId } }, 'Error fetching payment method by type and user ID');
      throw new Error("Error fetching payment method by type and user ID");
    }
  }

  // Delete payment method softly
  async deletePaymentMethod(id: string): Promise<void> {
    try {
      await this.payementMethodRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'deletePaymentMethod', paymentMethodId: id } }, 'Error deleting payment method');
      throw new Error("Error deleting payment method");
    }
  }

  // get user by googleId
  async getUserByGoogleId(googleId: string): Promise<UserModel | undefined> {
    try {
      return await this.userRepo.findOne({
        where: {
          googleId: googleId,
        },
        cache: {
          id: `user_google_${googleId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getUserByGoogleId', googleId } }, 'Error fetching user by Google ID');
      throw new Error("Error fetching user by Google ID");
    }
  }

  async getAllUsers(
    page: number,
    limit: number,
    role: UserRole
  ): Promise<{ data: UserModel[]; total: number }> {
    try {
      const [data, total] = await this.userRepo.findAndCount({
        where: {
          role: role,
        },
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `users_${role}_page_${page}_limit_${limit}`,
          milliseconds: 120000, // 2 minutes
        },
      });
      return { data, total };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'getAllUsers', role, page, limit } }, 'Error fetching users');
      throw new Error("Error fetching users");
    }
  }

  async searchTeachersAndAcademies(params: {
    page: number;
    limit: number;
    q?: string;
    topic?: string;
    teachingModes?: string[];
    minPrice?: number;
    maxPrice?: number;
    role?: UserRole;
    availabilityDay?: string;
    availabilityTimeStart?: string;
    availabilityTimeEnd?: string;
    isOnline?: boolean;
  }): Promise<{ data: UserModel[]; total: number }> {
    try {
      const {
        page,
        limit,
        q,
        topic,
        teachingModes,
        minPrice,
        maxPrice,
        role,
        availabilityDay,
        availabilityTimeStart,
        availabilityTimeEnd,
        isOnline
      } = params;

      // Use INNER JOIN if availability filters are provided to exclude users without matching slots
      // Use LEFT JOIN otherwise to show all users (even without availabilities)
      const hasAvailabilityFilters = !!(availabilityDay || availabilityTimeStart || availabilityTimeEnd);

      const query = this.userRepo.createQueryBuilder("user")
        .leftJoinAndSelect("user.topics", "userTopic", "userTopic.isActive = :isActive", { isActive: true })
        .leftJoinAndSelect("userTopic.topic", "topic", "topic.isActive = :isActive", { isActive: true });

      if (hasAvailabilityFilters) {
        // INNER JOIN: only return users with matching available slots
        query.innerJoinAndSelect("user.availabilities", "availabilities", "availabilities.isAvailable = :availabilityActive", { availabilityActive: true });
      } else {
        // LEFT JOIN: return all users, include available slots if they exist
        query.leftJoinAndSelect("user.availabilities", "availabilities", "availabilities.isAvailable = :availabilityActive", { availabilityActive: true });
      }

      if (role) {
        query.andWhere("user.role = :role", { role });
      } else {
        query.andWhere("user.role IN (:...roles)", { roles: [UserRole.TEACHER, UserRole.ACADEMY] });
      }

      if (q) {
        const cleanQ = String(q).trim();
        const terms = cleanQ.split(/\s+/).filter((t: string) => t.length > 0);

        // Support both stemming (exact word) and prefix matching (partial word)
        // for each term: "(word | word:*)"
        const formattedQuery = terms.map((t: string) => {
          const escaped = t.replace(/[:&|!()*]/g, '');
          return escaped ? `(${escaped} | ${escaped}:*)` : '';
        }).filter(Boolean).join(" | "); // Changed to OR logic for better recall

        if (formattedQuery) {
          const vectorContent = `
            to_tsvector('arabic', coalesce("user"."fullname", '') || ' ' || coalesce("user"."bio", '')) ||
            to_tsvector('english', coalesce("user"."fullname", '') || ' ' || coalesce("user"."bio", ''))
          `;

          query.andWhere(
            `(${vectorContent} @@ to_tsquery('arabic', :searchQuery) OR 
              ${vectorContent} @@ to_tsquery('english', :searchQuery))`,
            { searchQuery: formattedQuery }
          );

          // Use ts_rank for "sensible" relevance ordering (native to Postgres FTS)
          query.addSelect(`ts_rank(${vectorContent}, to_tsquery('arabic', :searchQuery)) + 
                           ts_rank(${vectorContent}, to_tsquery('english', :searchQuery))`, "search_rank");
          query.addOrderBy("search_rank", "DESC");
        }
      }

      if (topic) {
        query.andWhere("topic.name ILIKE :topicName", { topicName: `%${topic}%` });
      }

      if (minPrice !== undefined) {
        query.andWhere("userTopic.price >= :minPrice", { minPrice });
      }

      if (maxPrice !== undefined) {
        query.andWhere("userTopic.price <= :maxPrice", { maxPrice });
      }

      if (teachingModes && teachingModes.length > 0) {
        query.andWhere(new Brackets((qb: WhereExpressionBuilder) => {
          teachingModes.forEach((mode, index) => {
            const trimmedMode = mode.trim();
            if (index === 0) {
              qb.where("user.teachingModes ILIKE :mode" + index, { ["mode" + index]: `%${trimmedMode}%` });
            } else {
              qb.orWhere("user.teachingModes ILIKE :mode" + index, { ["mode" + index]: `%${trimmedMode}%` });
            }
          });
        }));
      }

      if (availabilityDay) {
        query.andWhere("availabilities.dayOfWeek = :day", { day: availabilityDay.toLowerCase() });
      }

      // Handle time filters - support partial ranges
      if (availabilityTimeStart && availabilityTimeEnd) {
        // Both provided: find teachers available DURING the time window (overlapping slots)
        query.andWhere(
          "availabilities.startTime <= :searchEndTime AND availabilities.endTime >= :searchStartTime",
          {
            searchStartTime: availabilityTimeStart,
            searchEndTime: availabilityTimeEnd
          }
        );
      } else if (availabilityTimeStart) {
        // Only start time: find teachers whose availability extends to or beyond this time
        query.andWhere("availabilities.endTime >= :searchStartTime", {
          searchStartTime: availabilityTimeStart
        });
      } else if (availabilityTimeEnd) {
        // Only end time: find teachers whose availability starts at or before this time
        query.andWhere("availabilities.startTime <= :searchEndTime", {
          searchEndTime: availabilityTimeEnd
        });
      }

      query.skip((page - 1) * limit).take(limit);

      // Create a deterministic cache key based on params
      const cacheKey = `search_teachers_${JSON.stringify(params)}`;
      query.cache(cacheKey, 120000);

      const [data, total] = await query.getManyAndCount();

      if (isOnline) {
        // Filter out users without IDs (shouldn't happen for persisted users) and force type to string
        const userIds = data.map((u: UserModel) => u.id).filter((id: string | undefined): id is string => !!id);
        const onlineUserIds = await this.chatService.getOnlineStatusBulk(userIds);
        const onlineUserSet = new Set(onlineUserIds);
        const onlineUsers = data.filter((u: UserModel) => u.id && onlineUserSet.has(u.id));
        // Note: total is still the DB total, not the filtered total.
        return { data: onlineUsers, total };
      }

      return { data, total };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'searchTeachersAndAcademies', params } }, 'Error searching teachers and academies');
      throw new Error("Error searching teachers and academies");
    }
  }

  async updateUserLocation(
    id: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      await this.userRepo.update(id, { latitude, longitude });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'updateUserLocation', userId: id } }, 'Error updating user location');
      throw new Error("Error updating user location");
    }
  }

  async findNearbyTeachers(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    limit: number;
    page: number;
  }): Promise<{ users: UserModel[]; total: number }> {
    try {
      const { latitude, longitude, radiusKm, limit, page } = params;
      const skip = (page - 1) * limit;

      // Haversine formula for calculating distance in kilometers
      // Using GREATEST to avoid acos domain errors (values must be between -1 and 1)
      const distanceFormula = `(
        6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians(${latitude})) * cos(radians("user"."latitude")) * 
            cos(radians("user"."longitude") - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians("user"."latitude"))
          ))
        )
      )`;

      const query = this.userRepo
        .createQueryBuilder("user")
        .select([
          "user.id",
          "user.fullname",
          "user.email",
          "user.phoneNumber",
          "user.role",
          "user.state",
          "user.district",
          "user.city",
          "user.address",
          "user.bio",
          "user.profilePicture",
          "user.latitude",
          "user.longitude",
          "user.teachingModes",
          "user.timeSlot",
          "user.gender",
          "user.isActive",
          "user.isApproved",
        ])
        .leftJoinAndSelect("user.topics", "userTopic", "userTopic.isActive = :isActive", { isActive: true })
        .leftJoinAndSelect("userTopic.topic", "topic", "topic.isActive = :isActive", { isActive: true })
        .leftJoinAndSelect("user.availabilities", "availabilities")
        .addSelect(distanceFormula, "distance")
        .where("user.role IN (:...roles)", { roles: [UserRole.TEACHER, UserRole.ACADEMY] })
        .andWhere("user.isActive = :isActive", { isActive: false })
        .andWhere("user.isApproved = :isApproved", { isApproved: false })
        .andWhere("user.latitude IS NOT NULL")
        .andWhere("user.longitude IS NOT NULL")
        .andWhere(`${distanceFormula} <= :radius`, { radius: radiusKm })
        .orderBy("distance", "ASC")
        .skip(skip)
        .take(limit);

      const [users, total] = await query.getManyAndCount();

      return { users, total };
    } catch (error) {
      log.error({ err: error, ctx: { service: 'UserService', op: 'findNearbyTeachers', params } }, 'Error finding nearby teachers');
      throw new Error("Error finding nearby teachers");
    }
  }
}
