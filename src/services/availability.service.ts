import { AppDataSource } from "../config/database";
import { AvailabilityModel } from "../models/availability.model";
import { AvailabilityExceptionModel } from "../models/availability-exception.model";
import { getLogger } from "../utils/logger";

const log = getLogger();

export class AvailabilityService {
  aviabilityRepo: any;
  availabilityExceptionRepo: any;

  constructor() {
    this.aviabilityRepo = AppDataSource.getRepository(AvailabilityModel);
    this.availabilityExceptionRepo = AppDataSource.getRepository(
      AvailabilityExceptionModel
    );
  }
  async createAvailability(
    availability: AvailabilityModel
  ): Promise<AvailabilityModel> {
    try {
      return await this.aviabilityRepo.save(availability);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'createAvailability' } }, 'Error creating availability');
      throw new Error("Error creating availability");
    }
  }

  async updateAvailability(availability: AvailabilityModel): Promise<void> {
    try {
      return await this.aviabilityRepo.save(availability);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'updateAvailability' } }, 'Error updating availability');
      throw new Error("Error updating availability");
    }
  }

  async getAvailabilityById(
    id: string
  ): Promise<AvailabilityModel | undefined> {
    try {
      return await this.aviabilityRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'getAvailabilityById', availabilityId: id } }, 'Error fetching availability');
      throw new Error("Error fetching availability");
    }
  }

  async createAvailabilityException(
    availabilityException: AvailabilityExceptionModel
  ): Promise<AvailabilityExceptionModel> {
    try {
      return await this.availabilityExceptionRepo.save(availabilityException);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'createAvailabilityException' } }, 'Error creating availability exception');
      throw new Error("Error creating availability exception");
    }
  }

  async updateAvailabilityException(
    availabilityException: AvailabilityExceptionModel
  ): Promise<void> {
    try {
      return await this.availabilityExceptionRepo.save(availabilityException);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'updateAvailabilityException' } }, 'Error updating availability exception');
      throw new Error("Error updating availability exception");
    }
  }

  async getAvailabilityExceptionById(
    id: string
  ): Promise<AvailabilityExceptionModel | undefined> {
    try {
      return await this.availabilityExceptionRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'getAvailabilityExceptionById', exceptionId: id } }, 'Error fetching availability exception');
      throw new Error("Error fetching availability exception");
    }
  }

  async deleteAvailabilityException(id: string): Promise<void> {
    try {
      await this.availabilityExceptionRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'deleteAvailabilityException', exceptionId: id } }, 'Error deleting availability exception');
      throw new Error("Error deleting availability exception");
    }
  }

  async deleteAvailability(id: string): Promise<void> {
    try {
      await this.aviabilityRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'deleteAvailability', availabilityId: id } }, 'Error deleting availability');
      throw new Error("Error deleting availability");
    }
  }

  // get teachers availabilities
  async getTeacherAvailability(
    teacherId: string
  ): Promise<AvailabilityModel[]> {
    try {
      return await this.aviabilityRepo.find({
        where: {
          user: {
            id: teacherId,
          },
        },
        cache: {
          id: `teacher_availability_${teacherId}`,
          milliseconds: 120000, // 2 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'getTeacherAvailability', teacherId } }, 'Error fetching teachers availabilities');
      throw new Error("Error fetching teachers availabilities");
    }
  }

  // get teachers availability exceptions
  async getTeacherAvailabilityExceptions(
    teacherId: string
  ): Promise<AvailabilityExceptionModel[]> {
    try {
      return await this.availabilityExceptionRepo.find({
        where: {
          user: {
            id: teacherId,
          },
        },
        cache: {
          id: `teacher_availability_exceptions_${teacherId}`,
          milliseconds: 120000, // 2 minutes
        },
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'getTeacherAvailabilityExceptions', teacherId } }, 'Error fetching teachers availability exceptions');
      throw new Error("Error fetching teachers availability exceptions");
    }
  }

  async deactivateAllAvailabilities(teacherId: string): Promise<void> {
    try {
      await this.aviabilityRepo.update(
        { user: { id: teacherId } },
        { isActive: false }
      );
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'deactivateAllAvailabilities', teacherId } }, 'Error deactivating all availabilities');
      throw new Error("Error deactivating all availabilities");
    }
  }

  async activateAllAvailabilities(teacherId: string): Promise<void> {
    try {
      await this.aviabilityRepo.update(
        { user: { id: teacherId } },
        { isActive: true }
      );
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'activateAllAvailabilities', teacherId } }, 'Error activating all availabilities');
      throw new Error("Error activating all availabilities");
    }
  }

  async findOverlappingAvailability(
    userId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityModel | null> {
    try {
      const overlapping = await this.aviabilityRepo
        .createQueryBuilder("availability")
        .leftJoinAndSelect("availability.user", "user")
        .where("user.id = :userId", { userId })
        .andWhere("availability.dayOfWeek = :dayOfWeek", { dayOfWeek })
        .andWhere("availability.startTime < :endTime", { endTime })
        .andWhere("availability.endTime > :startTime", { startTime })
        .getOne();

      return overlapping;
    } catch (error) {
      log.error({ err: error, ctx: { service: 'AvailabilityService', op: 'findOverlappingAvailability', userId, dayOfWeek, startTime, endTime } }, 'Error checking for overlapping availability');
      throw new Error("Error checking for overlapping availability");
    }
  }
}
