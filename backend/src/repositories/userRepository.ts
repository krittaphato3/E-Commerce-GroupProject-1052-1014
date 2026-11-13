import type { Role } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export interface StoredUser {
  id: number;
  email: string;
  displayName: string;
  passwordHash: string;
  role: Role;
}

/** Fields safe to return to the browser: never the password hash. */
export interface PublicUser {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}

export const userRepository = {
  findByEmail(email: string): Promise<StoredUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        role: true,
      },
    });
  },

  findPublicById(id: number): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, role: true },
    });
  },
};
