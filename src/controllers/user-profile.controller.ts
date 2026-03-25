import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import asyncHandler from "express-async-handler";
import { UserService } from "../services/user.service";
import { ChatService } from "../services/chat.service";
import { UserDto } from "../dtos/user.dto";
import { plainToInstance } from "class-transformer";
import { PaymentMethodDto } from "../dtos/payment-method.dto";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimal-user.dto";
import { AuthMiddleware } from "../utils/auth.middleware";
import { UserContactInfoDto } from "../dtos/user-contact-info.dto";
import { getLogger } from "../utils/logger";

/**
 * Handles user self-service operations (profile, payment methods, credentials).
 * Admin-only listing operations live in UserAdminController.
 */
@injectable()
export class UserProfileController {
  private userService: UserService;
  private chatService: ChatService;

  constructor(
    @inject(UserService) userService: UserService,
    @inject(ChatService) chatService: ChatService
  ) {
    this.userService = userService;
    this.chatService = chatService;
  }

  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserByIdNoCache(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    let userDto;
    if (user.role === UserRole.STUDENT || user.role === UserRole.SUPERVISOR) {
      userDto = plainToInstance(MinimalUserDto, user, { excludeExtraneousValues: true });
    } else {
      userDto = plainToInstance(UserDto, user, { excludeExtraneousValues: true });
    }
    userDto.isOnline = await this.chatService.getOnlineStatus(id);
    res.status(200).json(userDto);
  });

  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserByIdNoCache(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const updatedUser = { ...user, ...req.body };
    await this.userService.updateUser(id, updatedUser);
    void this.chatService
      .updateLightUser(id, {
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        profileImage: updatedUser.profilePicture,
      })
      .catch((chatError) => {
        (req.log || getLogger()).error({ err: chatError }, "Failed to update chat service user");
      });
    res.status(200).json({ message: "User updated successfully" });
  });

  getUserPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const userPlan = await this.userService.getUserPlan(id);
    res.status(200).json(userPlan?.plan);
  });

  addPaymentMethod = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const existingMethod = await this.userService.getPaymentMethodByTypeAndUserId(req.body.type, id);
    if (existingMethod) {
      res.status(409).json({ error: "Payment method already exists" });
      return;
    }
    const created = await this.userService.addPaymentMethod({ ...req.body, user });
    const dto = plainToInstance(PaymentMethodDto, created, { excludeExtraneousValues: true });
    res.status(201).json(dto);
  });

  updatePaymentMethod = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const paymentMethodId = req.params.paymentMethodId;
    const paymentMethod = await this.userService.getPaymentMethodById(paymentMethodId);
    if (!paymentMethod) {
      res.status(404).json({ error: "Payment method not found" });
      return;
    }
    await this.userService.updatePaymentMethod({ ...req.body, id: paymentMethodId, user });
    res.status(200).json({ message: "Payment method updated successfully" });
  });

  getPaymentMethodsByUserId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const paymentMethods = await this.userService.getPaymentMethodsByUserId(id);
    const dtos = plainToInstance(PaymentMethodDto, paymentMethods, { excludeExtraneousValues: true });
    res.status(200).json(dtos);
  });

  deletePaymentMethod = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const paymentMethodId = req.params.paymentMethodId;
    const paymentMethod = await this.userService.getPaymentMethodById(paymentMethodId);
    if (!paymentMethod) {
      res.status(404).json({ error: "Payment method not found" });
      return;
    }
    await this.userService.deletePaymentMethod(paymentMethodId);
    res.status(204).json({ message: "Payment method deleted successfully" });
  });

  updateUserPhoneNumber = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    user.phoneNumber = req.body.phoneNumber;
    await this.userService.updateUser(id, user);
    res.status(200).json({ message: "Phone number updated successfully" });
  });

  updateUserEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { email, password } = req.body;
    const existingUser = await this.userService.getUserByEmail(email);
    if (existingUser && existingUser.id !== id) {
      res.status(409).json({ error: "Email already exists." });
      return;
    }
    if (password) {
      const isAuthenticated = await AuthMiddleware.comparePasswords(password, user.password ?? "");
      if (!isAuthenticated) {
        res.status(400).json({ error: "Password is incorrect" });
        return;
      }
    }
    user.email = email;
    await this.userService.updateUser(id, user);
    res.status(200).json({ message: "Email updated successfully" });
  });

  updateUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { newPassword, currentPassword } = req.body;
    const isAuthenticated = await AuthMiddleware.comparePasswords(currentPassword, user.password ?? "");
    if (!isAuthenticated) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    user.password = await AuthMiddleware.hashPassword(newPassword);
    await this.userService.updateUser(id, user);
    res.status(200).json({ message: "Password updated successfully" });
  });

  updateUserContactInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await this.userService.updateUser(id, { ...user, ...req.body });
    res.status(200).json({ message: "Contact information updated successfully" });
  });

  getUserContactInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const dto = plainToInstance(UserContactInfoDto, user, { excludeExtraneousValues: true });
    res.status(200).json(dto);
  });

  getUserMinimalInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const dto = plainToInstance(MinimalUserDto, user, { excludeExtraneousValues: true });
    res.status(200).json(dto);
  });

  switchUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserByIdNoCache(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!user.isSwichable) {
      res.status(400).json({ error: "User role cannot be switched" });
      return;
    }
    user.role = user.role === UserRole.STUDENT ? UserRole.TEACHER : UserRole.STUDENT;
    await this.userService.updateUser(id, user);
    const token = await AuthMiddleware.generateToken(user);
    res.status(200).json({ message: "Role switched successfully", newToken: token });
  });

  updateUserLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const user = await this.userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { latitude, longitude } = req.body;
    await this.userService.updateUserLocation(id, latitude, longitude);
    res.status(200).json({ message: "Location updated successfully" });
  });
}
