import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UserDto } from "../dtos/user.dto";
import { plainToInstance } from "class-transformer";
import { PaymentMethodDto } from "../dtos/payment-method.dto";
import { UserRole } from "../enums/userRoles.enum";
import { MinimalUserDto } from "../dtos/minimal-user.dto";
import { AuthMiddleware } from "../utils/auth.middleware";
import { UserContactInfoDto } from "../dtos/user-contact-info.dto";
import { getLogger } from "../utils/logger";
import { ChatService } from "../services/chat.service";

export class UserController {
  private userService: UserService;
  private chatService: ChatService;
  constructor() {
    this.userService = new UserService();
    this.chatService = new ChatService();
  }

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserByIdNoCache(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      let userDto;
      if (user.role === UserRole.STUDENT || user.role === UserRole.SUPERVISOR) {
        userDto = plainToInstance(MinimalUserDto, user, {
          excludeExtraneousValues: true,
        });
      } else {
        userDto = plainToInstance(UserDto, user, {
          excludeExtraneousValues: true,
        });
      }

      res.status(200).json(userDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
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
          (req.log || getLogger()).error(
            { err: chatError },
            "Failed to update chat service user"
          );
        });
      res.status(200).json({ message: "User updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserByIdNoCache(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      await this.userService.deleteUser(id);
      res.status(204).json({ message: "User deleted successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Get user plan
  getUserPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const userPlan = await this.userService.getUserPlan(id);
      res.status(200).json(userPlan?.plan);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  // Add payemnt method
  addPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const payementMethod =
        await this.userService.getPaymentMethodByTypeAndUserId(
          req.body.type,
          id
        );
      if (payementMethod) {
        res.status(409).json({ error: "Payment method already exists" });
        return;
      }
      const paymentMethodBody = { ...req.body, user: user };
      const createdPayementMethod = await this.userService.addPaymentMethod(
        paymentMethodBody
      );
      const paymentMethodDto = plainToInstance(
        PaymentMethodDto,
        createdPayementMethod,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(paymentMethodDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  //Update payment method
  updatePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const paymentMethodId = req.params.paymentMethodId;
      const paymentMethod = await this.userService.getPaymentMethodById(
        paymentMethodId
      );
      if (!paymentMethod) {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      const paymentMethodBody = {
        ...req.body,
        id: paymentMethodId,
        user: user,
      };
      await this.userService.updatePaymentMethod(paymentMethodBody);
      res.status(200).json({ message: "Payment method updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (error.message === "Error fetching payment method") {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Get payment methods by user id
  getPaymentMethodsByUserId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const paymentMethods = await this.userService.getPaymentMethodsByUserId(
        id
      );
      const paymentMethodDtos = plainToInstance(
        PaymentMethodDto,
        paymentMethods,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(paymentMethodDtos);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Delete payment method
  deletePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const paymentMethodId = req.params.paymentMethodId;
      const paymentMethod = await this.userService.getPaymentMethodById(
        paymentMethodId
      );
      if (!paymentMethod) {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      await this.userService.deletePaymentMethod(paymentMethodId);
      res.status(204).json({ message: "Payment method deleted successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (error.message === "Error fetching payment method") {
        res.status(404).json({ error: "Payment method not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //  get All Teachers using pagination
  getAllTeachers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const { data: teachers, total } = await this.userService.getAllUsers(
        page,
        limit,
        UserRole.TEACHER
      );
      const teacherDtos = plainToInstance(UserDto, teachers, {
        excludeExtraneousValues: true,
      });
      
      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      
      res.status(200).json(teacherDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const { data: students, total } = await this.userService.getAllUsers(
        page,
        limit,
        UserRole.STUDENT
      );
      const studentDtos = plainToInstance(MinimalUserDto, students, {
        excludeExtraneousValues: true,
      });
      
      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      
      res.status(200).json(studentDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllAcademies = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const { data: academies, total } = await this.userService.getAllUsers(
        page,
        limit,
        UserRole.ACADEMY
      );
      const academyDtos = plainToInstance(UserDto, academies, {
        excludeExtraneousValues: true,
      });
      
      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      
      res.status(200).json(academyDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const { data: admins, total } = await this.userService.getAllUsers(
        page,
        limit,
        UserRole.SUPERVISOR
      );
      const adminDtos = plainToInstance(MinimalUserDto, admins, {
        excludeExtraneousValues: true,
      });
      
      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());
      
      res.status(200).json(adminDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // create user by admin
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        res.status(409).json({ error: "User already exists." });
        return;
      }
      const hashedPassword = await AuthMiddleware.hashPassword(password);
      req.body.password = hashedPassword;
      const createdUser = await this.userService.createUser(req.body);
      const userDto = plainToInstance(UserDto, createdUser, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(userDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //update user's phone number
  updateUserPhoneNumber = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.phoneNumber = req.body.phoneNumber;
      await this.userService.updateUser(id, user);
      res.status(200).json({ message: "Phone number updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //update user's email
  updateUserEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const { email, password } = req.body;
      // check email if already exists
      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser && existingUser.id !== id) {
        res.status(409).json({ error: "Email already exists." });
        return;
      }
      // check password if provided
      if (password) {
        const isAuthenticated = await AuthMiddleware.comparePasswords(
          password,
          user.password ?? ""
        );
        if (!isAuthenticated) {
          res.status(400).json({ error: "Password is incorrect" });
          return;
        }
      }
      user.email = email;
      await this.userService.updateUser(id, user);
      res.status(200).json({ message: "Email updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // update user's password
  updateUserPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const { newPassword, currentPassword } = req.body;
      const isAuthenticated = await AuthMiddleware.comparePasswords(
        currentPassword,
        user.password ?? ""
      );
      if (!isAuthenticated) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }
      const hashedPassword = await AuthMiddleware.hashPassword(newPassword);
      user.password = hashedPassword;
      await this.userService.updateUser(id, user);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //update user's contact information
  updateUserContactInfo = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userData = { ...user, ...req.body };
      await this.userService.updateUser(id, userData);
      res
        .status(200)
        .json({ message: "Contact information updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get user contact information
  getUserContactInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const userContactInfoDto = plainToInstance(UserContactInfoDto, user, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(userContactInfoDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUserMinimalInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const userDto = plainToInstance(MinimalUserDto, user, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(userDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Switch user role between student and teacher
  switchUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
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
      const newRole: UserRole = user.role === UserRole.STUDENT ? UserRole.TEACHER : UserRole.STUDENT;
      user.role = newRole;
      await this.userService.updateUser(id, user);
      const token = await AuthMiddleware.generateToken(user);
      res
        .status(200)
        .json({ message: "Role switched successfully", newToken: token });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Update user's GPS location
  updateUserLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const { latitude, longitude } = req.body;
      await this.userService.updateUserLocation(id, latitude, longitude);
      res.status(200).json({ message: "Location updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      if (error.message === "Error fetching user") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Get nearby teachers and academies
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

      const userDtos = plainToInstance(UserDto, users, {
        excludeExtraneousValues: true,
      });

      res.setHeader("X-Total-Count", total.toString());
      res.setHeader("X-Page", page.toString());
      res.setHeader("X-Limit", limit.toString());

      res.status(200).json(userDtos);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, 'Error in user operation');
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
