import { Permission } from "../enums/permission.enum";
import { UserRole } from "../enums/userRoles.enum";

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.TEACHER_CRUD,
    Permission.STUDENT_CRUD,
    Permission.ACADEMY_CRUD,
    Permission.USER_CRUD,
    Permission.SUBSCRIPTION,
    Permission.PAYMENT_METHOD_CRUD,
  ],
  [UserRole.TEACHER]: [
    Permission.TEACHER_CRUD,
    Permission.USER_CRUD,
    Permission.SUBSCRIPTION,
    Permission.PAYMENT_METHOD_CRUD,
  ],
  [UserRole.STUDENT]: [Permission.STUDENT_CRUD, Permission.USER_CRUD],
  [UserRole.ACADEMY]: [
    Permission.ACADEMY_CRUD,
    Permission.USER_CRUD,
    Permission.SUBSCRIPTION,
    Permission.PAYMENT_METHOD_CRUD,
  ],
};

export const getImageUrl = (filename: string): string => {
  return `${process.env.BASE_URL}/uploads/${filename}`;
};

export const getPermission = (permissionValue: number): Permission | null => {
  if (permissionValue in Permission) {
    return permissionValue as Permission;
  }
  return null; // Handle invalid values
};

export const getDurationInMonths = (
  duration?: number,
  unit?: string
): number => {
  //check if the parameters are not null or undefined
  const adjustedDuration = duration ?? 0;
  const adjustedUnit = unit || "months";
  if (adjustedUnit === "years") {
    return adjustedDuration * 12;
  }
  return adjustedDuration;
};
