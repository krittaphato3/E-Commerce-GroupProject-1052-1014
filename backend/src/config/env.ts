import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TEST_DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().default("local-development-session-secret-must-be-at-least-32-chars"),
  SESSION_TTL_HOURS: z.string().default("8").transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
