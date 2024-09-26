// app/constants/permissions.ts
export const PERMISSION_LEVELS = {
  ADMIN: "admin",
  WRITE: "write",
  READ: "read",
} as const;

export type PermissionLevel =
  (typeof PERMISSION_LEVELS)[keyof typeof PERMISSION_LEVELS];
