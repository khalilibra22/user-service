import { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service";
import { AvailabilityDto } from "../dtos/availability.dto";
import { plainToInstance } from "class-transformer";
import { UserService } from "../services/user.service";
import { AvailabilityExceptionDto } from "../dtos/availability-exception.dto";
import { boolean } from "joi";
import { getLogger } from "../utils/logger";

export class AvailabilityController {
  private availabilityService: AvailabilityService;
  private userService: UserService;
  constructor() {
    this.availabilityService = new AvailabilityService();
    this.userService = new UserService();
  }

  getTeacherAvailability = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error in getAvailability');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to get availability" });
    }
  }

  // Create new availability
  createAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { dayOfWeek, startTime, endTime } = req.body;
      if (!dayOfWeek || !startTime || !endTime) {
        res.status(400).json({ error: "dayOfWeek, startTime, and endTime are required" });
        return;
      }

      // Validate time slot
      if (startTime >= endTime) {
        res.status(400).json({
          error: "Invalid time slot",
          message: `Start time (${startTime}) must be before end time (${endTime})`,
        });
        return;
      }

      const overlapping = await this.availabilityService.findOverlappingAvailability(
        id,
        dayOfWeek,
        startTime,
        endTime
      );

      if (overlapping) {
        res.status(409).json({
          error: "Availability conflict",
          message: `An availability already exists for ${dayOfWeek} that overlaps with the time range ${startTime} - ${endTime}`,
          conflictingAvailability: {
            id: overlapping.id,
            dayOfWeek: overlapping.dayOfWeek,
            startTime: overlapping.startTime,
            endTime: overlapping.endTime,
          },
        });
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
      (req.log || getLogger()).error({ err: error }, 'Error creating availability');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to create availability" });
    }
  }

  // Update availability
  updateAvailability = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error updating availability');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to update availability" });
    }
  }

  // Delete availability
  deleteAvailability = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error deleting availability');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to delete availability" });
    }
  }

  // Create availability exception
  createAvailabilityException = async (
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
      (req.log || getLogger()).error({ err: error }, 'Error creating availability exception');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res
        .status(500)
        .json({ error: "Failed to create availability exception" });
    }
  }

  // Get availability exceptions
  getTeacherAvailabilityExceptions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error getting availability exceptions');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to get availability exceptions" });
    }
  }

  // Delete availability exception
  deleteAvailabilityException = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error deleting availability exception');
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
  updateAvailabilityException = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error updating availability exception');
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
  toggleAvailabilityStatus = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error toggling availability status');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to toggle availability status" });
    }
  }

  // Toggle all availability isActive status
  deactivateAllAvailabilities = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error toggling all availability statuses');
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
  activateAllAvailabilities = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, 'Error activating all availabilities');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Failed to activate all availabilities" });
    }
  }

  // Check availabilities by IDs
  checkAvailabilitiesByIds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { availabilityIds, allowUnavailable } = req.body;

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
      if (!allowUnavailable) {
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
      (req.log || getLogger()).error({ err: error }, 'Error checking availabilities');
      res.status(500).json({ error: "Failed to check availabilities" });
    }
  }

  updateAvailabilitiesToUnavailable = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { availabilityIds, reservedUntil } = req.body;

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

      const updatePromises = availabilityIds.map(async (idOrObj) => {
        const availabilityId = typeof idOrObj === "string" ? idOrObj : idOrObj.id;
        const availability = await this.availabilityService.getAvailabilityById(
          availabilityId
        );
        if (availability) {
          const updateData: any = { ...availability, isAvailable: false };
          const individualReservedUntil = typeof idOrObj === "object" ? idOrObj.reservedUntil : undefined;
          const finalReservedUntil = individualReservedUntil || reservedUntil;

          if (finalReservedUntil) {
            updateData.reservedUntil = new Date(finalReservedUntil);
          }
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
      (req.log || getLogger()).error({ err: error }, 'Error updating availabilities');
      res.status(500).json({ error: "Failed to update availabilities" });
    }
  }
}
