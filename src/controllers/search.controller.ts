import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { plainToInstance } from "class-transformer";
import { SearchUserDto } from "../dtos/searchUser.dto";

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
      const searchResult = await this.userService.searchTeachersAndAcademies(
        page,
        limit
      );
      const searchUserDtos = plainToInstance(SearchUserDto, searchResult, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(searchUserDtos);
    } catch (error: any) {
      console.error("Error in searchTeachersAndAcademies:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
