// permissions.ts
export type Action = "create" | "read" | "update" | "delete";
export type Resource =
  | "availabilities"
  | "coupons"
  | "users"
  | "academic_backgrounds"; // example

// Define roles and what they can do
export const permissions: Record<string, Record<Resource, Action[]>> = {
  0: {
    availabilities: ["create", "read", "update", "delete"],
    coupons: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete"],
    academic_backgrounds: ["create", "read", "update", "delete"],
  },
  1: {
    availabilities: ["create", "read", "update", "delete"],
    coupons: ["create", "read", "update", "delete"],
    academic_backgrounds: ["create", "read", "update", "delete"],
    users: [],
  },
  2: {
    availabilities: ["read"],
    coupons: ["read"],
    academic_backgrounds: ["read"],
    users: [],
  },
  3: {
    availabilities: ["create", "read", "update", "delete"],
    coupons: ["create", "read", "update", "delete"],
    academic_backgrounds: [],
    users: [],
  },
  4: {
    availabilities: [],
    coupons: [],
    academic_backgrounds: [],
    users: [],
  },
};
