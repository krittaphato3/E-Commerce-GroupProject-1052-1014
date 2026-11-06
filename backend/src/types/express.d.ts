import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        displayName: string;
        role: Role;
      };
    }
  }
}

export {};
