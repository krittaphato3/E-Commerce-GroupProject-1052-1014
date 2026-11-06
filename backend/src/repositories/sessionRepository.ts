import { prisma } from "../db/prisma.js";
import type { PublicUser } from "./userRepository.js";

export type SessionUser = PublicUser;

export const sessionRepository = {
  create(data: { userId: number; tokenHash: string; expiresAt: Date }) {
    return prisma.session.create({ data });
  },

  /**
   * Finds a session that has not expired and returns its user, never the hash.
   * If the session row exists but has expired, deletes it before returning null.
   */
  async findValid(tokenHash: string, now: Date): Promise<{ user: SessionUser } | null> {
    const session = await prisma.session.findFirst({
      where: { tokenHash },
      select: {
        expiresAt: true,
        user: {
          select: { id: true, email: true, displayName: true, role: true },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt <= now) {
      await prisma.session.deleteMany({ where: { tokenHash } });
      return null;
    }

    return { user: session.user };
  },

  deleteByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } });
  },

  deleteExpired(now: Date = new Date()) {
    return prisma.session.deleteMany({ where: { expiresAt: { lte: now } } });
  },
};
