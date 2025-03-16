import { Permission } from "../enums/permission.enum";
import { UserRole } from "../enums/userRoles.enum";

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.TEACHER_CRUD,
    Permission.STUDENT_CRUD,
    Permission.ACADEMY_CRUD,
    Permission.USER_CRUD,
  ],
  [UserRole.TEACHER]: [Permission.TEACHER_CRUD, Permission.USER_CRUD],
  [UserRole.STUDENT]: [Permission.STUDENT_CRUD, Permission.USER_CRUD],
  [UserRole.ACADEMY]: [Permission.ACADEMY_CRUD, Permission.USER_CRUD],
};

export const getImageUrl = (filename: string): string => {
  return `${process.env.BASE_URL}/uploads/${filename}`;
};
