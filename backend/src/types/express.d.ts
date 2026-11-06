import type { PublicUser } from "../repositories/userRepository.js";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
