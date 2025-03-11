import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthMiddleware } from "../utils/auth.middleware";
import { UserDto } from "../dto/user.dto";
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
      res.status(201).json(new UserDto(createdUser));
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
    const isAuthenticated = await AuthMiddleware.comparePasswords(
      password,
      user.password
    );
    if (!isAuthenticated) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }
    const token = await AuthMiddleware.generateToken(user);
    res.status(200).json({ id: user.id, token: token });
  }
}
