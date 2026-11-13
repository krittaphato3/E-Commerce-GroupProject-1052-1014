import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import { loginSchema, validateBody } from "../middleware/validate.js";
import { guardsFor } from "./registry.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", ...guardsFor("GET", "/api/auth/me"), me);
