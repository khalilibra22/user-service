import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { SearchUserDto } from "../dtos/searchUser.dto";
import { getLogger } from "../utils/logger";

export class SearchController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }

  searchTeachersAndAcademies = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query as any;
      const { data: searchResult, total } = await this.userService.searchTeachersAndAcademies(
        Number(page),
        Number(limit)
      );
      const searchUserDtos = plainToInstance(SearchUserDto, searchResult, {
        excludeExtraneousValues: true,
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
}
