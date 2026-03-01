import express from "express"
import cors from "cors"
import path from "path"
import fs from "fs"
import multer from "multer"
import sharp from "sharp"
import { PrismaClient } from "@prisma/client"

const app = express()
const prisma = new PrismaClient()

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads")

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    // Temporarily use original name; we'll rename after we know the product ID
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"))
    }
    cb(null, true)
  },
})

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(UPLOAD_DIR))

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// Categories CRUD (basic)
app.get("/api/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { catid: "asc" } })
  res.json(categories)
})

app.post("/api/categories", async (req, res) => {
  const rawName = typeof req.body.name === "string" ? req.body.name.trim() : ""
  if (!rawName) {
    return res.status(400).json({ error: "Name is required" })
  }
  const category = await prisma.category.create({ data: { name: rawName } })
  res.status(201).json(category)
})

// Update category name
app.put("/api/categories/:catid", async (req, res) => {
  const catid = Number(req.params.catid)
  if (Number.isNaN(catid)) {
    return res.status(400).json({ error: "Invalid category id" })
  }

  const rawName = typeof req.body.name === "string" ? req.body.name.trim() : ""
  if (!rawName) {
    return res.status(400).json({ error: "Name is required" })
  }

  try {
    const updated = await prisma.category.update({ where: { catid }, data: { name: rawName } })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update category" })
  }
})

// Delete category (only if no products reference it)
app.delete("/api/categories/:catid", async (req, res) => {
  const catid = Number(req.params.catid)
  if (Number.isNaN(catid)) {
    return res.status(400).json({ error: "Invalid category id" })
  }

  try {
    const productCount = await prisma.product.count({ where: { catid } })
    if (productCount > 0) {
      return res.status(400).json({ error: "Cannot delete category with existing products" })
    }

    await prisma.category.delete({ where: { catid } })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete category" })
  }
})

// Products CRUD (basic) with image upload
app.get("/api/products", async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } })
  res.json(products)
})

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { catid, name, price, description } = req.body

    const trimmedName = typeof name === "string" ? name.trim() : ""
    const trimmedDescription = typeof description === "string" ? description.trim() : ""

    if (!catid || !trimmedName || !price || !trimmedDescription) {
      return res.status(400).json({ error: "catid, name, price, and description are required" })
    }

    const numericPrice = Number(price)
    const numericCatId = Number(catid)

    if (Number.isNaN(numericPrice) || Number.isNaN(numericCatId)) {
      return res.status(400).json({ error: "Invalid catid or price" })
    }

    // First create product without imagePath
    const created = await prisma.product.create({
      data: {
        name: trimmedName,
        price: numericPrice,
        description: trimmedDescription,
        catid: numericCatId,
      },
    })

    if (req.file) {
      const ext = path.extname(req.file.originalname) || path.extname(req.file.filename) || ".jpg"
      const baseName = `product-${created.pid}`
      const fullImagePath = path.join(UPLOAD_DIR, `${baseName}${ext}`)
      const thumbImagePath = path.join(UPLOAD_DIR, `${baseName}-thumb${ext}`)

      // Create full-size image (fit within 800x800)
      await sharp(req.file.path)
        .resize(800, 800, { fit: "inside" })
        .toFile(fullImagePath)

      // Create thumbnail (fit within 200x200)
      await sharp(req.file.path)
        .resize(200, 200, { fit: "inside" })
        .toFile(thumbImagePath)

      fs.unlinkSync(req.file.path)

      await prisma.product.update({
        where: { pid: created.pid },
        data: {
          imagePath: `/uploads/${baseName}${ext}`,
          thumbPath: `/uploads/${baseName}-thumb${ext}`,
        },
      })
    }

    const finalProduct = await prisma.product.findUnique({ where: { pid: created.pid } })
    res.status(201).json(finalProduct)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create product" })
  }
})

app.put("/api/products/:pid", upload.single("image"), async (req, res) => {
  try {
    const pid = Number(req.params.pid)
    if (Number.isNaN(pid)) {
      return res.status(400).json({ error: "Invalid product id" })
    }

    const { catid, name, price, description } = req.body

    const data: any = {}
    if (catid !== undefined) data.catid = Number(catid)
    if (name !== undefined && typeof name === "string" && name.trim()) data.name = name.trim()
    if (price !== undefined) data.price = Number(price)
    if (description !== undefined && typeof description === "string" && description.trim()) {
      data.description = description.trim()
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname) || path.extname(req.file.filename) || ".jpg"
      const baseName = `product-${pid}`
      const fullImagePath = path.join(UPLOAD_DIR, `${baseName}${ext}`)
      const thumbImagePath = path.join(UPLOAD_DIR, `${baseName}-thumb${ext}`)

      await sharp(req.file.path)
        .resize(800, 800, { fit: "inside" })
        .toFile(fullImagePath)

      await sharp(req.file.path)
        .resize(200, 200, { fit: "inside" })
        .toFile(thumbImagePath)

      fs.unlinkSync(req.file.path)

      data.imagePath = `/uploads/${baseName}${ext}`
      data.thumbPath = `/uploads/${baseName}-thumb${ext}`
    }

    const updated = await prisma.product.update({ where: { pid }, data })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update product" })
  }
})

app.delete("/api/products/:pid", async (req, res) => {
  try {
    const pid = Number(req.params.pid)
    if (Number.isNaN(pid)) {
      return res.status(400).json({ error: "Invalid product id" })
    }

    await prisma.product.delete({ where: { pid } })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete product" })
  }
})

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`)
})
