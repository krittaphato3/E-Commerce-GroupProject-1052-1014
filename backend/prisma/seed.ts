import { PrismaClient, Role, OrderStatus, PaymentStatus } from "@prisma/client";
import dotenv from "dotenv";
import { env } from "../src/config/env.js";
import { hashPassword } from "../src/services/password.js";

dotenv.config();

const prisma = new PrismaClient();

const SEED_PASSWORD_PLACEHOLDER = "change-me-local";

function readSeedPassword(name: "SEED_CUSTOMER_PASSWORD" | "SEED_OPERATOR_PASSWORD"): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required to seed the database. Add it to backend/.env (see backend/.env.example).`
    );
  }

  if (process.env.NODE_ENV === "production" && value === SEED_PASSWORD_PLACEHOLDER) {
    throw new Error(
      `${name} still has the placeholder value. Set a real seed password before seeding production.`
    );
  }

  return value;
}

/**
 * Demo data is on by default locally and off in production. It covers the demo
 * customers, the extra operators and the test-fixture menu items (sold-out,
 * last-unit, delisted). The starter menu and the first operator are always
 * seeded. SEED_DEMO_DATA overrides the default: "true"/"1" or "false"/"0".
 * Any other non-empty value throws, so a typo can never silently flip it.
 */
export function isDemoSeedEnabled(raw: NodeJS.ProcessEnv = process.env): boolean {
  const value = raw.SEED_DEMO_DATA?.trim().toLowerCase();
  if (!value) return raw.NODE_ENV !== "production";
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(
    `SEED_DEMO_DATA must be "true", "false", "1" or "0" (got "${raw.SEED_DEMO_DATA}"). Unset it to use the NODE_ENV default.`
  );
}

export const SEED_USERS = [
  {
    email: "customer1@campusbites.test",
    displayName: "Alice Customer",
    role: Role.CUSTOMER,
  },
  {
    email: "customer2@campusbites.test",
    displayName: "Bob Customer",
    role: Role.CUSTOMER,
  },
  {
    email: "operator1@campusbites.test",
    displayName: "Staff Operator 1",
    role: Role.OPERATOR,
  },
  {
    email: "operator2@campusbites.test",
    displayName: "Staff Operator 2",
    role: Role.OPERATOR,
  },
];

interface SeedMenuItem {
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable: boolean;
}

/** Starter menu: always seeded, create-only so live prices and stock survive a re-seed. */
export const STARTER_MENU_ITEMS: SeedMenuItem[] = [
  {
    name: "Basil Pork Rice",
    description: "Spicy stir-fried minced pork with holy basil and jasmine rice",
    priceSatang: 6000,
    stockQty: 30,
    isAvailable: true,
  },
  {
    name: "Green Curry with Rice",
    description: "Aromatic green curry with chicken and Thai eggplant",
    priceSatang: 6500,
    stockQty: 25,
    isAvailable: true,
  },
  {
    name: "Fried Rice with Egg",
    description: "Classic Thai wok-fried rice with eggs and vegetables",
    priceSatang: 5500,
    stockQty: 30,
    isAvailable: true,
  },
  {
    name: "Thai Iced Tea",
    description: "Traditional sweet Thai tea with milk",
    priceSatang: 3000,
    stockQty: 50,
    isAvailable: true,
  },
];

/**
 * Fixtures for the sold-out, last-unit and delisted cases used by the tests and
 * e2e journeys. Seeded only when demo data is enabled; also create-only.
 */
export const DEMO_FIXTURE_MENU_ITEMS: SeedMenuItem[] = [
  {
    name: "Mango Sticky Rice",
    description: "Sweet ripe mango with coconut sticky rice",
    priceSatang: 8000,
    stockQty: 1,
    isAvailable: true,
  },
  {
    name: "Chicken Sandwich",
    description: "Grilled chicken sandwich",
    priceSatang: 7000,
    stockQty: 0,
    isAvailable: true,
  },
  {
    name: "Pad Thai",
    description: "Stir-fried rice noodles with tamarind sauce",
    priceSatang: 6000,
    stockQty: 20,
    isAvailable: false,
  },
];

export interface SeedOptions {
  /** Seed demo users and fixture menu items. Defaults to isDemoSeedEnabled(). */
  demo?: boolean;
}

export async function seedDatabase(
  client: PrismaClient = prisma,
  options: SeedOptions = {}
) {
  const demo = options.demo ?? isDemoSeedEnabled();

  // Without demo data only the first operator is seeded, picked by role.
  const usersToSeed = demo
    ? SEED_USERS
    : SEED_USERS.filter((user) => user.role === Role.OPERATOR).slice(0, 1);

  if (usersToSeed.length === 0) {
    throw new Error("Seed selected no users; refusing to report success with an empty user list.");
  }

  const needsCustomerPassword = usersToSeed.some((user) => user.role === Role.CUSTOMER);
  const customerHash = needsCustomerPassword
    ? await hashPassword(readSeedPassword("SEED_CUSTOMER_PASSWORD"), env.BCRYPT_ROUNDS)
    : null;
  const operatorHash = await hashPassword(
    readSeedPassword("SEED_OPERATOR_PASSWORD"),
    env.BCRYPT_ROUNDS
  );

  // 1. Users: create-only. An existing user keeps its passwordHash and every other field.
  for (const user of usersToSeed) {
    const passwordHash = user.role === Role.OPERATOR ? operatorHash : customerHash;
    if (!passwordHash) {
      throw new Error(`No password hash available for seed user ${user.email}.`);
    }
    await client.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
    });
  }

  // 2. Menu: create-only too, so a re-seed never overwrites live price, stock or availability.
  const menuItems = demo
    ? [...STARTER_MENU_ITEMS, ...DEMO_FIXTURE_MENU_ITEMS]
    : STARTER_MENU_ITEMS;
  for (const item of menuItems) {
    await client.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item },
    });
  }
}

/**
 * Deterministic generator for benchmark orders to support NFR-05 load testing.
 */
export async function seedPerformanceOrders(
  client: PrismaClient = prisma,
  orderCount: number = 500
) {
  const customer = await client.user.findFirst({
    where: { role: Role.CUSTOMER },
  });
  if (!customer) throw new Error("No customer found for performance seed");

  const perfItem = await client.menuItem.upsert({
    where: { name: "Order Test Item (NFR-05)" },
    update: {
      stockQty: 100000,
      isAvailable: true,
      priceSatang: 5000,
    },
    create: {
      name: "Order Test Item (NFR-05)",
      description: "Provisioned item with high stock for performance benchmarks",
      priceSatang: 5000,
      stockQty: 100000,
      isAvailable: true,
    },
  });

  const existingOrders = await client.order.count({
    where: { customerId: customer.id },
  });

  const ordersNeeded = Math.max(0, orderCount - existingOrders);
  if (ordersNeeded <= 0) return;

  const batchSize = 100;
  for (let b = 0; b < ordersNeeded; b += batchSize) {
    const currentBatch = Math.min(batchSize, ordersNeeded - b);

    const orders = await client.order.createManyAndReturn({
      data: Array.from({ length: currentBatch }, () => ({
        customerId: customer.id,
        status: OrderStatus.ACCEPTED,
        paymentStatus: PaymentStatus.PAID,
        totalSatang: perfItem.priceSatang,
      })),
      select: { id: true },
    });

    await client.orderItem.createMany({
      data: orders.map((order) => ({
        orderId: order.id,
        menuItemId: perfItem.id,
        itemName: perfItem.name,
        unitPriceSatang: perfItem.priceSatang,
        quantity: 1,
        lineTotalSatang: perfItem.priceSatang,
      })),
    });
  }
}

async function main() {
  // seedDatabase decides what to seed from isDemoSeedEnabled(): with demo data
  // off it still creates the first operator and the starter menu.
  await seedDatabase();

  if (process.argv.includes("--with-perf-orders")) {
    await seedPerformanceOrders();
  }
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
