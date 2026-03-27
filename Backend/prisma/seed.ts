import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // Create categories
  await prisma.category.createMany({
    data: [
      { name: "CPU" },
      { name: "GPU" },
      { name: "Memory" },
    ],
  })

  // Fetch categories with IDs
  const allCategories = await prisma.category.findMany()
  const cpu = allCategories.find((c) => c.name === "CPU")!
  const gpu = allCategories.find((c) => c.name === "GPU")!
  const mem = allCategories.find((c) => c.name === "Memory")!

  // Create products
  await prisma.product.createMany({
    data: [
      // CPU (2 products)
      {
        name: "Intel Core Ultra 9 285K",
        price: 475,
        description: "Flagship 24-core Arrow Lake processor.",
        catid: cpu.catid,
      },
      {
        name: "Intel Core Ultra 7 265K",
        price: 290,
        description: "High-performance CPU for gaming and productivity.",
        catid: cpu.catid,
      },

      // GPU (2 products)
      {
        name: "NVIDIA GeForce RTX 5090",
        price: 1999,
        description: "Next-generation flagship GPU.",
        catid: gpu.catid,
      },
      {
        name: "NVIDIA GeForce RTX 5080",
        price: 1200,
        description: "High-end GPU for 4K gaming.",
        catid: gpu.catid,
      },

      // Memory (2 products)
      {
        name: "G.Skill Trident Z5 RGB DDR5-6400 32GB",
        price: 150,
        description: "High-speed DDR5 memory kit.",
        catid: mem.catid,
      },
      {
        name: "Corsair Vengeance RGB DDR5-6000 32GB",
        price: 140,
        description: "RGB DDR5 memory for modern platforms.",
        catid: mem.catid,
      },
    ],
  })

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10)
  const userPassword = await bcrypt.hash("user123", 10)

  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "ADMIN",
      },
      {
        username: "testuser",
        email: "user@example.com",
        password: userPassword,
        role: "NORMAL",
      },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
