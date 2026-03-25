import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { SearchUserDto } from "../dtos/search-user.dto";
import { getLogger } from "../utils/logger";
import { ChatService } from "../services/chat.service";

@injectable()
export class SearchController {
  private userService: UserService;
  private chatService: ChatService;

  constructor(
    @inject(UserService) userService: UserService,
    @inject(ChatService) chatService: ChatService
  ) {
    this.userService = userService;
    this.chatService = chatService;
  }

  searchTeachersAndAcademies = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
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
      } = req.query as any;

      const { data: searchResult, total } = await this.userService.searchTeachersAndAcademies({
        page: Number(page),
        limit: Number(limit),
        q,
        topic,
        teachingModes: teachingModes ? String(teachingModes).split(',') : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        role: role ? Number(role) : undefined,
        availabilityDay: availabilityDay ? String(availabilityDay).split(',') : undefined,
        availabilityTimeStart: availabilityTimeStart ? String(availabilityTimeStart).split(',') : undefined,
        availabilityTimeEnd: availabilityTimeEnd ? String(availabilityTimeEnd).split(',') : undefined,
        isOnline: isOnline === 'true' ? true : undefined
      });
      const searchUserDtos = plainToInstance(SearchUserDto, searchResult, {
        excludeExtraneousValues: true,
      });

      const userIds = searchResult.map((u: any) => u.id);
      const onlineUserIds = await this.chatService.getOnlineStatusBulk(userIds);

      searchUserDtos.forEach((dto) => {
        dto.isOnline = onlineUserIds.includes(dto.id!);
      });

      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());

      res.status(200).json(searchUserDtos);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in searchTeachersAndAcademies');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getNearbyTeachers = async (req: Request, res: Response): Promise<void> => {
    try {
      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);
      const radius = Number(req.query.radius) || 10;
      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;

      const { users, total } = await this.userService.findNearbyTeachers({
        latitude,
        longitude,
        radiusKm: radius,
        limit,
        page,
      });

      const searchUserDtos = plainToInstance(SearchUserDto, users, {
        excludeExtraneousValues: true,
      });

      const userIds = users.map((u: any) => u.id);
      const onlineUserIds = await this.chatService.getOnlineStatusBulk(userIds);

      searchUserDtos.forEach((dto) => {
        dto.isOnline = onlineUserIds.includes(dto.id!);
      });

      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());

      res.status(200).json(searchUserDtos);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in getNearbyTeachers');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
