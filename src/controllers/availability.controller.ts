import { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service";
import { AvailabilityDto } from "../dtos/availability.dto";
import { plainToInstance } from "class-transformer";
import { UserService } from "../services/user.service";
import { AvailabilityExceptionDto } from "../dtos/availabilityException.dto";
import { boolean } from "joi";

export class AvailabilityController {
  private availabilityService: AvailabilityService;
  private userService: UserService;
  constructor() {
    this.availabilityService = new AvailabilityService();
    this.userService = new UserService();
  }

  async getTeacherAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const availability =
        await this.availabilityService.getTeacherAvailability(userId);
      const availabilityDtos = plainToInstance(AvailabilityDto, availability, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(availabilityDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to get availability" });
    }
  }

  // Create new availability
  async createAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const availabilityData = { ...req.body, user: user };
      const newAvailability = await this.availabilityService.createAvailability(
        availabilityData
      );
      const availabilityDto = plainToInstance(
        AvailabilityDto,
        newAvailability,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(availabilityDto);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to create availability" });
    }
  }

  // Update availability
  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id, availabilityId } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const availability = await this.availabilityService.getAvailabilityById(
        availabilityId
      );
      if (!availability) {
        res.status(404).json({ error: "Availability not found" });
        return;
      }
      const updateData = { ...availability, ...req.body };
      await this.availabilityService.updateAvailability(updateData);
      res.status(200).json({ message: "Availability updated successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to update availability" });
    }
  }

  // Delete availability
  async deleteAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id, availabilityId } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const availability = await this.availabilityService.getAvailabilityById(
        availabilityId
      );
      if (!availability) {
        res.status(404).json({ error: "Availability not found" });
        return;
      }
      await this.availabilityService.deleteAvailability(availabilityId);
      res.status(204).json({ message: "Availability deleted", id });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to delete availability" });
    }
  }

  // Create availability exception
  async createAvailabilityException(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const exceptionData = { ...req.body, user: user };
      const newException =
        await this.availabilityService.createAvailabilityException(
          exceptionData
        );
      const exeptionDto = plainToInstance(
        AvailabilityExceptionDto,
        newException,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(exeptionDto);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      console.error(error);
      res
        .status(500)
        .json({ error: "Failed to create availability exception" });
    }
  }

  // Get availability exceptions
  async getTeacherAvailabilityExceptions(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const exceptions =
        await this.availabilityService.getTeacherAvailabilityExceptions(id);
      const exeptionDtos = plainToInstance(
        AvailabilityExceptionDto,
        exceptions,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(exeptionDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to get availability exceptions" });
    }
  }

  // Delete availability exception
  async deleteAvailabilityException(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id, exceptionId } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const exception =
        await this.availabilityService.getAvailabilityExceptionById(
          exceptionId
        );
      if (!exception) {
        res.status(404).json({ error: "Availability exception not found" });
        return;
      }
      await this.availabilityService.deleteAvailabilityException(exceptionId);
      res.status(204).json({ message: "Availability exception deleted", id });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to delete availability exception" });
    }
  }

  // update availability exception
  async updateAvailabilityException(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id, exceptionId } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const exception =
        await this.availabilityService.getAvailabilityExceptionById(
          exceptionId
        );
      if (!exception) {
        res.status(404).json({ error: "Availability exception not found" });
        return;
      }
      const updateData = { ...exception, ...req.body };
      await this.availabilityService.updateAvailabilityException(updateData);
      res
        .status(200)
        .json({ message: "Availability exception updated successfully" });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to update availability exception" });
    }
  }

  // Toggle availability isActive status
  async toggleAvailabilityStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id, availabilityId } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const availability = await this.availabilityService.getAvailabilityById(
        availabilityId
      );
      if (!availability) {
        res.status(404).json({ error: "Availability not found" });
        return;
      }
      const updateData = { ...availability, isActive: !availability.isActive };
      await this.availabilityService.updateAvailability(updateData);
      res.status(200).json({
        message: "Availability status toggled successfully",
      });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to toggle availability status" });
    }
  }

  // Toggle all availability isActive status
  async deactivateAllAvailabilities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await this.availabilityService.deactivateAllAvailabilities(id);
      res.status(200).json({
        message: "All availabilities deactivated successfully",
      });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to toggle all availability statuses" });
    }
  }

  // Activate all availability status
  async activateAllAvailabilities(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await this.availabilityService.activateAllAvailabilities(id);
      res.status(200).json({
        message: "All availabilities activated successfully",
      });
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to activate all availabilities" });
    }
  }

  // Check availabilities by IDs
  async checkAvailabilitiesByIds(req: Request, res: Response): Promise<void> {
    try {
      const { availabilityIds } = req.body;

      if (!availabilityIds || !Array.isArray(availabilityIds)) {
        res.status(400).json({ error: "Availability IDs array is required" });
        return;
      }

      if (availabilityIds.length === 0) {
        res
          .status(400)
          .json({ error: "Availability IDs array cannot be empty" });
        return;
      }

      const availabilities = await Promise.all(
        availabilityIds.map(async (availabilityId) => {
          const availability =
            await this.availabilityService.getAvailabilityById(availabilityId);
          return availability;
        })
      );

      // Filter out null/undefined availabilities
      const validAvailabilities = availabilities.filter(
        (availability) => availability !== null && availability !== undefined
      );

      if (validAvailabilities.length !== availabilityIds.length) {
        res.status(404).json({
          message: "Some availabilities not found",
          found: validAvailabilities.length,
          requested: availabilityIds.length,
        });
        return;
      }

      // Check if all availabilities are active
      const inactiveAvailabilities = validAvailabilities.filter(
        (availability) => !availability.isAvailable
      );
      if (inactiveAvailabilities.length > 0) {
        res.status(400).json({
          message: "Some availabilities are not available",
          inactiveCount: inactiveAvailabilities.length,
        });
        return;
      }

      const availabilityDtos = plainToInstance(
        AvailabilityDto,
        validAvailabilities,
        {
          excludeExtraneousValues: true,
        }
      );

      res.status(200).json(availabilityDtos);
    } catch (error: any) {
      console.error("Error checking availabilities:", error);
      res.status(500).json({ error: "Failed to check availabilities" });
    }
  }

  async updateAvailabilitiesToUnavailable(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { availabilityIds } = req.body;

      if (!availabilityIds || !Array.isArray(availabilityIds)) {
        res.status(400).json({ error: "Availability IDs array is required" });
        return;
      }

      if (availabilityIds.length === 0) {
        res
          .status(400)
          .json({ error: "Availability IDs array cannot be empty" });
        return;
      }

      const updatePromises = availabilityIds.map(async (availabilityId) => {
        const availability = await this.availabilityService.getAvailabilityById(
          availabilityId
        );
        if (availability) {
          const updateData = { ...availability, isAvailable: false };
          return await this.availabilityService.updateAvailability(updateData);
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      const updatedCount = results.filter((result) => result !== null).length;

      res.status(200).json({
        message: "Availabilities updated successfully",
        updatedCount,
        requestedCount: availabilityIds.length,
      });
    } catch (error: any) {
      //console.error("Error updating availabilities:", error);
      res.status(500).json({ error: "Failed to update availabilities" });
    }
  }
}
