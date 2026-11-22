import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const baseSchema = z.object({
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TEST_DATABASE_URL: z.string().optional(),
  SESSION_TTL_HOURS: z.string().default("8").transform((val) => parseInt(val, 10)),
  BCRYPT_ROUNDS: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(4).max(15)),
  // Unset: secure in production, not otherwise. An explicit value always wins.
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  CLIENT_ORIGIN: z.string().min(1).optional(),
});

const envSchema = baseSchema.transform((value) => ({
  ...value,
  COOKIE_SECURE: value.COOKIE_SECURE ?? value.NODE_ENV === "production",
}));

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(raw);
}

export const env = parseEnv();
