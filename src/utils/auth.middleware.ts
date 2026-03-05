import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config";
import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { UserRole } from "../enums/userRoles.enum";
import { UserDto } from "../dtos/user.dto";
import { permissions, privileges } from "../config/permissions";
import { Action, Resource } from "./permission-types";

class AuthMiddleware {
  private static saltRounds = 10;

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  static async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(plainTextPassword, hashedPassword, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  static async generateToken(user: UserModel): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            roles: user.role,
          },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn as any }
        );
        resolve(token);
      } catch {
        reject();
      }
    });
  }
  static async decodeToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, config.jwt.secret);
        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        console.warn(`[AUTH] No token provided for ${req.method} ${req.url}`);
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      const decoded = await AuthMiddleware.decodeToken(token);
      console.log(`[AUTH] Token verified for user: ${decoded.id}`);
      res.locals.user = decoded;
      next();
    } catch (error: any) {
      console.error(`[AUTH] Token verification failed: ${error.message}`);
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
  }

  static async getTokenDecode(token: string): Promise<UserDto> {
    return new Promise((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, config.jwt.secret);
        const userDto: UserDto = {
          id: decoded.id,
          email: decoded.email,
          phoneNumber: decoded.phoneNumber,
          role: decoded.roles,
        };
        resolve(userDto);
      } catch (error) {
        reject(error);
      }
    });
  }

  static authorize(resource: Resource, action: Action) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = res.locals.user;

        // Guard: user must exist (verifyToken must run first)
        if (!user) {
          res.status(403).json({ message: "Forbidden" });
          return;
        }

        const roleId = (user.roles ??
          UserRole.GUEST) as keyof typeof permissions;
        const rolePermissions = permissions[roleId];
        if (rolePermissions && rolePermissions[resource]?.includes(action)) {
          next();
          return;
        }
        console.warn(`[AUTH] Authorization failed for user ${user.id} (${roleId}). Resource: ${resource}, Action: ${action}`);
        res.status(403).json({ message: "Forbidden" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    };
  }

  /**
   * Ensures the authenticated user is the resource owner.
   * Use for sensitive writes (password, email, payment methods, etc.).
   */
  static requireSelf(req: Request, res: Response, next: NextFunction): void {
    const callerId: string = res.locals.user?.id;
    const resourceId: string = req.params.id;
    if (!callerId || callerId !== resourceId) {
      res.status(403).json({ message: "Forbidden: you can only access your own resources" });
      return;
    }
    next();
  }

  /**
   * Ensures the caller is either the resource owner OR an admin/supervisor.
   * Use for reads that are private but admins need to manage (e.g. payment-methods, coupons).
   */
  static requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
    const caller = res.locals.user;
    const resourceId: string = req.params.id;
    const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR];
    if (!caller || (caller.id !== resourceId && !adminRoles.includes(caller.roles as UserRole))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  }

  private static checkMethodPrivileges(
    method: string,
    resource: Resource,
    action: Action
  ): Boolean {
    const methodPrivileges = privileges[method];
    if (
      methodPrivileges &&
      methodPrivileges[resource] &&
      methodPrivileges[resource].includes(action)
    ) {
      return true;
    }
    return false;
  }
}
export { AuthMiddleware };
