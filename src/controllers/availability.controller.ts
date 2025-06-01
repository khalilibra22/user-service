import { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service";

export class AvailabilityController {
  private availabilityService: AvailabilityService;
  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  async getTeacherAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const availability =
        await this.availabilityService.getTeacherAvailability(userId);
      res.status(200).json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to get availability" });
    }
  }

  // Create new availability
  async createAvailability(req: Request, res: Response): Promise<void> {
    try {
      const availabilityData = req.body;
      const newAvailability = await this.availabilityService.createAvailability(
        availabilityData
      );
      res
        .status(201)
        .json({ message: "Availability created", data: newAvailability });
    } catch (error) {
      res.status(500).json({ error: "Failed to create availability" });
    }
  }

  // Update availability
  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedAvailability =
        await this.availabilityService.updateAvailability(updateData);
      res
        .status(200)
        .json({ message: "Availability updated", data: updatedAvailability });
    } catch (error) {
      res.status(500).json({ error: "Failed to update availability" });
    }
  }

  // Delete availability
  async deleteAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.availabilityService.deleteAvailability(id);
      res.status(200).json({ message: "Availability deleted", id });
    } catch (error) {
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
