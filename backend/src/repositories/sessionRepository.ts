import type { Role } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}

export const sessionRepository = {
  create(data: { userId: number; tokenHash: string; expiresAt: Date }) {
    return prisma.session.create({ data });
  },

  /** Finds a session that has not expired and returns its user, never the hash. */
  findValid(tokenHash: string, now: Date): Promise<{ user: SessionUser } | null> {
    return prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: now } },
      select: {
        user: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });
  },

  deleteByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } });
  },
};
