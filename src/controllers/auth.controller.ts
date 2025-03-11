import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthMiddleware } from "../utils/auth.middleware";
export class AuthController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        res.status(404).json({ error: "User already exists." });
        return;
      }
      const hashedPassword = await AuthMiddleware.hashPassword(password);
      req.body.password = hashedPassword;
      const createdUser = await this.userService.createUser(req.body);
      res.status(201).json(createdUser);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email" });
      return;
    }
    const pass: string = password;
    if (user.password != pass) {
      res.status(401).json({ error: "password" });
      return;
    }
    res.status(200).json(user);
  }
}
