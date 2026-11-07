import { Router } from "express";
import { listMenu } from "../controllers/menuController.js";

export const menuRouter = Router();

menuRouter.get("/", listMenu);
