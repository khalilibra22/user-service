import { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service";
import { AvailabilityDto } from "../dtos/availability.dto";
import { plainToInstance } from "class-transformer";
import { UserService } from "../services/user.service";

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
    } catch (error) {
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
      const availabilityData = req.body;
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
      const exceptionData = req.body;
      const newException =
        await this.availabilityService.createAvailabilityException(
          exceptionData
        );
      res.status(201).json({
        message: "Availability exception created",
        data: newException,
      });
    } catch (error) {
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
      const { userId } = req.params;
      const exceptions =
        await this.availabilityService.getTeacherAvailabilityExceptions(userId);
      res.status(200).json(exceptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get availability exceptions" });
    }
  }

  // Delete availability exception
  async deleteAvailabilityException(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      await this.availabilityService.deleteAvailabilityException(id);
      res.status(200).json({ message: "Availability exception deleted", id });
    } catch (error) {
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
      const { id } = req.params;
      const updateData = req.body;
      const updatedException =
        await this.availabilityService.updateAvailabilityException(updateData);
      res.status(200).json({
        message: "Availability exception updated",
        data: updatedException,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update availability exception" });
    }
  }
}
