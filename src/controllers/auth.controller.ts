import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthMiddleware } from "../utils/auth.middleware";
import { UserDto } from "../dtos/user.dto";
import { plainToInstance } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimal-user.dto";
import { getLogger } from "../utils/logger";
import { ChatService } from "../services/chat.service";
import { NotificationService } from "../services/notification.service";
import { SubscriptionService } from "../services/subscription.service";


export class AuthController {
  private userService: UserService;
  private chatService: ChatService;
  private notificationService: NotificationService;
  private subscriptionService: SubscriptionService;
  constructor() {
    this.userService = new UserService();
    this.chatService = new ChatService();
    this.notificationService = new NotificationService();
    this.subscriptionService = new SubscriptionService();
  }
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        res.status(409).json({ error: "User already exists." });
        return;
      }

      // Files are already uploaded to S3 by the s3UploadMiddleware
      // req.body.profilePicture and req.body.certificate now contain S3 URLs
      // No need to check req.files or process filenames

      const hashedPassword = await AuthMiddleware.hashPassword(password);
      req.body.password = hashedPassword;
      if (req.body.role == 1) {
        req.body = { ...req.body, isSwichable: true }; // Set isSwichable to true for teachers
      }
      const createdUser = await this.userService.createUser(req.body);
      const token = await AuthMiddleware.generateToken(createdUser);

      // --- Auto-assign Free Plan to Teachers and Academies ---
      if (
        createdUser.id &&
        (createdUser.role === UserRole.TEACHER || createdUser.role === UserRole.ACADEMY)
      ) {
        try {
          await this.subscriptionService.assignDefaultFreePlan(createdUser.id);
        } catch (subError) {
          (req.log || getLogger()).error(
            { err: subError, userId: createdUser.id },
            "Failed to auto-assign free plan during registration"
          );
          // Non-blocking: we still complete registration even if assigning the plan fails
        }
      }

      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/v1/auth/verify-email?token=${token}`;
      void this.notificationService.sendEmailVerification(createdUser.email ?? email, createdUser.fullname ?? 'Utilisateur', verificationUrl);

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
      void this.chatService
        .createLightUser({
          userId: createdUser.id ?? "",
          fullname: createdUser.fullname ?? undefined,
          email: createdUser.email ?? undefined,
          profileImage: createdUser.profilePicture ?? undefined,
        })
        .catch((chatError) => {
          (req.log || getLogger()).error(
            { err: chatError },
            "Failed to replicate user to chat service"
          );
        });

      res.status(201).json(userDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in register');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fcmToken } = req.body;
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
      if (fcmToken) {
        user.fcmToken = fcmToken;
        await this.userService.updateUser(user.id ?? "", user);
      }
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

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await this.notificationService.sendPasswordReset(user.email ?? email, user.fullname ?? 'Utilisateur', resetUrl);

      res
        .status(200)
        .json({ message: "Password reset link sent to email" });
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    try {
      //read token from query params
      const token = req.query.token as string;
      let decoded = null;
      try {
        decoded = await AuthMiddleware.decodeToken(token || "");
      } catch (error) {
        (req.log || getLogger()).error({ err: error }, 'Invalid or expired token');
        const html = this.notificationService.renderTemplate('verification-error', {
          message: "Votre lien de vérification est invalide ou a expiré.",
          frontendUrl
        });
        res.status(401).send(html || "Invalid or expired token");
        return;
      }
      const id = decoded.id;
      const user = await this.userService.getUserById(id);

      if (!user) {
        const html = this.notificationService.renderTemplate('verification-error', {
          message: "Utilisateur non trouvé.",
          frontendUrl
        });
        res.status(404).send(html || "User not found");
        return;
      }
      user.isActive = true;
      await this.userService.updateUser(id, user);

      const html = this.notificationService.renderTemplate('verification-success', { frontendUrl });
      res.status(200).send(html || "Email verified successfully");
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in verifyEmail');
      const html = this.notificationService.renderTemplate('verification-error', {
        message: "Une erreur interne est survenue lors de la vérification.",
        frontendUrl
      });
      res.status(500).send(html || "Internal Server Error");
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
