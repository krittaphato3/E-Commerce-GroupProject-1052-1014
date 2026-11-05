import { PrismaClient, Role, OrderStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

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

export const SEED_MENU_ITEMS = [
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
  {
    name: "Mango Sticky Rice",
    description: "Sweet ripe mango with coconut sticky rice (last unit test)",
    priceSatang: 8000,
    stockQty: 1,
    isAvailable: true,
  },
  {
    name: "Chicken Sandwich",
    description: "Grilled chicken sandwich (sold out test)",
    priceSatang: 7000,
    stockQty: 0,
    isAvailable: true,
  },
  {
    name: "Pad Thai",
    description: "Stir-fried rice noodles with tamarind sauce (delisted test)",
    priceSatang: 6000,
    stockQty: 20,
    isAvailable: false,
  },
];

export async function seedDatabase(client: PrismaClient = prisma) {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || "customer123!";
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD || "operator123!";

  const customerHash = await bcrypt.hash(customerPassword, 10);
  const operatorHash = await bcrypt.hash(operatorPassword, 10);

  // 1. Seed Users (idempotent upsert)
  for (const user of SEED_USERS) {
    const passwordHash = user.role === Role.OPERATOR ? operatorHash : customerHash;
    await client.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
    });
  }

  // 2. Seed Menu Items (idempotent upsert)
  for (const item of SEED_MENU_ITEMS) {
    await client.menuItem.upsert({
      where: { name: item.name },
      update: {
        description: item.description,
        priceSatang: item.priceSatang,
        stockQty: item.stockQty,
        isAvailable: item.isAvailable,
      },
      create: {
        name: item.name,
        description: item.description,
        priceSatang: item.priceSatang,
        stockQty: item.stockQty,
        isAvailable: item.isAvailable,
      },
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
    for (let i = 0; i < currentBatch; i++) {
      await client.order.create({
        data: {
          customerId: customer.id,
          status: OrderStatus.ACCEPTED,
          paymentStatus: PaymentStatus.PAID,
          totalSatang: perfItem.priceSatang,
          items: {
            create: {
              menuItemId: perfItem.id,
              itemName: perfItem.name,
              unitPriceSatang: perfItem.priceSatang,
              quantity: 1,
              lineTotalSatang: perfItem.priceSatang,
            },
          },
        },
      });
    }
  }
}

async function main() {
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
