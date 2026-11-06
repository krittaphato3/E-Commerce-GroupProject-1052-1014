import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const DEV_SESSION_SECRET = "local-development-session-secret-must-be-at-least-32-chars";

const envSchema = z
  .object({
    PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    TEST_DATABASE_URL: z.string().optional(),
    SESSION_SECRET: z.string().default(DEV_SESSION_SECRET),
    SESSION_TTL_HOURS: z.string().default("8").transform((val) => parseInt(val, 10)),
    CLIENT_ORIGIN: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;

    if (value.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be set to a unique value in production",
      });
    } else if (value.SESSION_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be at least 32 characters in production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(raw);
}

export const env = parseEnv();
