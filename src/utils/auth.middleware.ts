import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { UserRole } from "../enums/userRoles.enum";
import { UserDto } from "../dtos/user.dto";
import { permissions, privileges } from "../config/permissions";
import { Action, Resource } from "./permissionTypes";

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
          process.env.JWT_SECRET!
          //{ expiresIn: "1h" }
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
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
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
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      const decoded = await AuthMiddleware.decodeToken(token);
      req.body.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
  }

  static async getTokenDecode(token: string): Promise<UserDto> {
    return new Promise((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
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
        const user = req.body.user;
        delete req.body.user;
        const hasAccess = AuthMiddleware.checkMethodPrivileges(
          req.method,
          resource,
          action
        );
        if (hasAccess) {
          next();
          return;
        }
        if (req.params.id && req.params.id !== user.id) {
          res.status(403).json({ message: "Forbidden" });
          return;
        }
        // set by your token middleware
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
        res.status(403).json({ message: "Forbidden" });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    };
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
