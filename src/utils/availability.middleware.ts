import { Request, Response, NextFunction } from "express";

interface AvailabilityRequest extends Request {
  body: {
    teacherId: string;
    startTime: string;
    endTime: string;
    date: string;
  };
}

interface TeacherAvailability {
  id: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  date: string;
}

export class AvailabilityMiddleware {
  // Mock function to get teacher's weekly availability
  // Replace with actual database call
  private async getTeacherWeeklyAvailability(
    teacherId: string,
    dayOfWeek: string
  ): Promise<TeacherAvailability[]> {
    // TODO: Implement database query to get teacher's weekly availability by day
    return [];
  }

  private getDayOfWeek(date: string): string {
    const dateObj = new Date(date);
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[dateObj.getDay()];
  }

  private isTimeOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const startTime1 = new Date(`1970-01-01T${start1}`);
    const endTime1 = new Date(`1970-01-01T${end1}`);
    const startTime2 = new Date(`1970-01-01T${start2}`);
    const endTime2 = new Date(`1970-01-01T${end2}`);

    return startTime1 < endTime2 && startTime2 < endTime1;
  }

  public checkTeacherAvailability = async (
    req: AvailabilityRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { teacherId, startTime, endTime, date } = req.body;

      if (!teacherId || !startTime || !endTime || !date) {
        res.status(400).json({
          error: "Missing required fields: teacherId, startTime, endTime, date",
        });
        return;
      }

      const dayOfWeek = this.getDayOfWeek(date);
      const weeklyAvailability = await this.getTeacherWeeklyAvailability(
        teacherId,
        dayOfWeek
      );

      const hasConflict = weeklyAvailability.some((availability) =>
        this.isTimeOverlapping(
          startTime,
          endTime,
          availability.startTime,
          availability.endTime
        )
      );

      if (hasConflict) {
        res.status(409).json({
          error: `Teacher is not available on ${dayOfWeek} during the specified time range`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: "Internal server error while checking availability",
      });
    }
  };
}
