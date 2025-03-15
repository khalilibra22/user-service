import { RolePermissions } from ".";
import { Permission } from "../enums/permission.enum";
import { UserRole } from "../enums/userRoles.enum";

export class PermissionMiddleware {
  static checkPermission(role: UserRole, permission: Permission): boolean {
    return RolePermissions[role].includes(permission);
  }
}
