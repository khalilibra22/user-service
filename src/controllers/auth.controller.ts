import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthMiddleware } from "../utils/auth.middleware";
import { UserDto } from "../dtos/user.dto";
import { plainToInstance } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimal-user.dto";
import { getLogger } from "../utils/logger";

export class AuthController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        res.status(409).json({ error: "User already exists." });
        return;
      }
      if (!req.files) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.body.profilePicture = files.profilePicture
        ? files.profilePicture[0].filename
        : null;
      req.body.certificate = files.certificate
        ? files.certificate[0].filename
        : null;

      const hashedPassword = await AuthMiddleware.hashPassword(password);
      req.body.password = hashedPassword;
      if (req.body.role == 1) {
        req.body = { ...req.body, isSwichable: true }; // Set isSwichable to true for teachers
      }
      const createdUser = await this.userService.createUser(req.body);
      const token = await AuthMiddleware.generateToken(createdUser);
      //const verificationLink = `http://localhost:5000/auth/verify-email?token=${token}`;
      let userDto;
      if (
        createdUser.role === UserRole.STUDENT ||
        createdUser.role === UserRole.SUPERVISOR
      ) {
        userDto = plainToInstance(MinimalUserDto, createdUser, {
          excludeExtraneousValues: true,
        });
      } else {
        userDto = plainToInstance(UserDto, createdUser, {
          excludeExtraneousValues: true,
        });
      }
      res.status(201).json(userDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in register');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const isAuthenticated = await AuthMiddleware.comparePasswords(
        password,
        user.password ?? ""
      );
      if (!isAuthenticated) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const token = await AuthMiddleware.generateToken(user);
      res.status(200).json({ id: user.id, token: token });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in login');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const token = await AuthMiddleware.generateToken(user);
      //TODO: Send email with password reset link
      res
        .status(200)
        .json({ message: "Password reset link sent to email", token: token });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in forgotPassword');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      let decoded = null;
      try {
        decoded = await AuthMiddleware.decodeToken(token || "");
      } catch (error) {
        (req.log || getLogger()).error({ err: error }, 'Invalid or expired token');
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      const { password } = req.body;
      const id = decoded.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const hashedPassword = await AuthMiddleware.hashPassword(password);
      user.password = hashedPassword;
      await this.userService.updateUser(id, user);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in resetPassword');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      //read token from query params
      const token = req.query.token as string;
      let decoded = null;
      try {
        decoded = await AuthMiddleware.decodeToken(token || "");
      } catch (error) {
        (req.log || getLogger()).error({ err: error }, 'Invalid or expired token');
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }
      const id = decoded.id;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.isActive = true;
      await this.userService.updateUser(id, user);
      res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in verifyEmail');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      req.logout(() => {
        res.status(200).json({ message: "Logged out" });
      });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in logout');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // sign in with google
  googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as any;
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      // const state = req.query.state;
      // if (typeof state !== "string") {
      //   res.status(400).json({ error: "Invalid state parameter" });
      //   return;
      // }
      // const decoded = JSON.parse(
      //   Buffer.from(state, "base64").toString("utf-8")
      // );
      // const role = decoded.role;

      const token = await AuthMiddleware.generateToken(user);
      res.status(200).json({ id: user.id, token: token });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in googleLogin');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
