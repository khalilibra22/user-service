import { AppDataSource } from "../config/database";
import { AvailabilityModel } from "../models/availability.model";
import { AvailabilityExceptionModel } from "../models/availabilityException.model";

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
      console.error(error);
      throw new Error("Error creating availability");
    }
  }

  async updateAvailability(availability: AvailabilityModel): Promise<void> {
    try {
      return await this.aviabilityRepo.save(availability);
    } catch (error) {
      console.error(error);
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
      throw new Error("Error fetching availability");
    }
  }

  async createAvailabilityException(
    availabilityException: AvailabilityExceptionModel
  ): Promise<AvailabilityExceptionModel> {
    try {
      return await this.availabilityExceptionRepo.save(availabilityException);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating availability exception");
    }
  }

  async updateAvailabilityException(
    availabilityException: AvailabilityExceptionModel
  ): Promise<void> {
    try {
      return await this.availabilityExceptionRepo.save(availabilityException);
    } catch (error) {
      console.error(error);
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
      throw new Error("Error fetching availability exception");
    }
  }

  async deleteAvailabilityException(id: string): Promise<void> {
    try {
      await this.availabilityExceptionRepo.softDelete(id);
    } catch (error) {
      console.error(error);
      throw new Error("Error deleting availability exception");
    }
  }

  async deleteAvailability(id: string): Promise<void> {
    try {
      await this.aviabilityRepo.softDelete(id);
    } catch (error) {
      console.error(error);
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
          teacher: {
            id: teacherId,
          },
        },
      });
    } catch (error) {
      console.error(error);
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
          teacher: {
            id: teacherId,
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching teachers availability exceptions");
    }
  }
}
