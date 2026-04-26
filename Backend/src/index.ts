import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import session from "express-session"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import multer from "multer"
import sharp from "sharp"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

const app = express()
const prisma = new PrismaClient()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10'
})

// Comprehensive Content Security Policy
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' ws: wss:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "block-all-mixed-content",
  "upgrade-insecure-requests"
].join('; ')

// CSRF Token Generation (32+ bytes, hex)
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// CSRF Validation Middleware
type CsrfValidationOptions = {
  ignoreMethods?: string[]
}

const validateCsrf = (options: CsrfValidationOptions = {}) => {
  const { ignoreMethods = ['GET', 'HEAD', 'OPTIONS'] } = options
  
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip CSRF validation for safe methods
    if (ignoreMethods.includes(req.method)) {
      return next()
    }
    
    // Get CSRF token from cookie
    const csrfTokenFromCookie = req.cookies?.['XSRF-TOKEN']
    
    // Get CSRF token from header
    const csrfTokenFromHeader = req.headers['x-xsrf-token'] as string || req.headers['x-csrf-token'] as string
    
    // Validate tokens
    if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
      console.warn('CSRF validation failed: Missing tokens', {
        method: req.method,
        url: req.url,
        hasCookie: !!csrfTokenFromCookie,
        hasHeader: !!csrfTokenFromHeader
      })
      return res.status(403).json({ error: 'CSRF token missing' })
    }
    
    if (csrfTokenFromCookie !== csrfTokenFromHeader) {
      console.warn('CSRF validation failed: Token mismatch', {
        method: req.method,
        url: req.url,
        cookieToken: csrfTokenFromCookie.substring(0, 8) + '...',
        headerToken: csrfTokenFromHeader.substring(0, 8) + '...'
      })
      return res.status(403).json({ error: 'CSRF token invalid' })
    }
    
    // CSRF validation passed
    next()
  }
}

// Apply security headers manually
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', cspHeader)
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Cross-origin policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  
  // HSTS in production
  if (process.env.NODE_ENV === 'IERG4210') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Remove server information
  res.removeHeader('X-Powered-By')
  
  next()
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads")
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const SESSION_SECRET = process.env.SESSION_SECRET || "your-session-secret-change-in-production"

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Session configuration with secure settings
const sessionConfig = {
  name: 'sessionId',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevent client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}

// Middleware setup
app.use(cookieParser())
app.use(session(sessionConfig))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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

// CORS configuration with security considerations
app.use(cors({
  origin: process.env.NODE_ENV === 'IERG4210' 
    ? ['https://s01.ierg4210.iecuhk.cc', 'http://localhost:5173', 'http://localhost:3000'] // Production + dev origins
    : ['http://localhost:5173', 'http://localhost:3000'], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-Token', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Apply CSRF validation to all API routes (except safe methods)
app.use('/api', validateCsrf())

// Static file serving
app.use("/uploads", express.static(UPLOAD_DIR))

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Admin role middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// CSRF Token endpoint - provides token for client-side apps
app.get("/api/csrf-token", (req, res) => {
  const csrfToken = generateCsrfToken()
  
  // Set CSRF token as cookie with secure settings
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Allow client-side JavaScript to read
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
  
  res.json({ csrfToken }) // Also return token in response for convenience
})

// Register user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "NORMAL"
      },
      select: {
        uid: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    // Generate token
    const token = jwt.sign(
      { uid: user.uid, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken()
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Allow client-side JavaScript to read
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    res.status(201).json({ user, token, csrfToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to register user" })
  }
})

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: "Username/email and password are required" })
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier }
        ]
      }
    })

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign(
      { uid: user.uid, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken()
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Allow client-side JavaScript to read
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user

    res.json({ user: userWithoutPassword, token, csrfToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to login" })
  }
})

// Get all users (admin only)
app.get("/api/users", authenticateToken, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" })
    }

    const users = await prisma.user.findMany({
      select: {
        uid: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Reset password API
app.post("/api/auth/reset-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = req.user as any

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid }
    })

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await prisma.user.update({
      where: { uid: user.uid },
      data: { password: hashedNewPassword }
    })

    res.json({ message: "Password updated successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update password" })
  }
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

// Order Digest Generation
function generateOrderDigest(orderData: {
  currency: string
  merchantEmail: string
  salt: string
  items: Array<{ pid: number; quantity: number; price: number; productName: string }>
  totalPrice: number
}): string {
  const crypto = require('crypto')
  
  // Create digest string: currency|merchantEmail|salt|pid:quantity:price|pid:quantity:price|...|totalPrice
  const itemsString = orderData.items
    .map(item => `${item.pid}:${item.quantity}:${item.price}`)
    .join('|')
  
  const digestString = [
    orderData.currency,
    orderData.merchantEmail,
    orderData.salt,
    itemsString,
    orderData.totalPrice.toString()
  ].join('|')
  
  return crypto.createHash('sha256').update(digestString).digest('hex')
}

// Order Validation and Creation
app.post("/api/orders/create", authenticateToken, validateCsrf(), async (req, res) => {
  try {
    const { items } = req.body
    const user = req.user as any

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" })
    }

    // Validate each item
    for (const item of items) {
      if (!item.pid || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Invalid item data: pid and positive quantity required" })
      }
    }

    // Fetch products from database to get current prices and validate existence
    const productIds = items.map(item => item.pid)
    const products = await prisma.product.findMany({
      where: { pid: { in: productIds } }
    })

    // Check if all products exist
    if (products.length !== items.length) {
      return res.status(400).json({ error: "One or more products not found" })
    }

    // Calculate total and prepare order items with snapshot data
    let totalPrice = 0
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.pid === item.pid)
      if (!product) {
        throw new Error(`Product ${item.pid} not found`)
      }
      
      const itemTotal = product.price * item.quantity
      totalPrice += itemTotal
      
      return {
        pid: item.pid,
        quantity: item.quantity,
        price: product.price, // Snapshot price
        productName: product.name // Snapshot name
      }
    })

    // Generate salt and digest
    const salt = crypto.randomBytes(32).toString('hex')
    const digestData = {
      currency: 'HKD',
      merchantEmail: 'dick2452683247@gmail.com',
      salt,
      items: orderItemsData,
      totalPrice
    }
    
    const digest = generateOrderDigest(digestData)

    // Create order in database
    const order = await prisma.order.create({
      data: {
        uid: user.uid,
        totalAmount: totalPrice,
        status: 'PENDING',
        digest,
        currency: 'HKD',
        merchantEmail: 'dick2452683247@gmail.com',
        salt
      }
    })

    // Create order items
    await prisma.orderItem.createMany({
      data: orderItemsData.map(item => ({
        oid: order.oid,
        pid: item.pid,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName
      }))
    })

    // Create Stripe Checkout Session
    try {
      // Validate minimum amount (Stripe minimum is ~HKD 4.00)
      const minimumAmountHKD = 4.00; // HKD 4.00 minimum
      if (totalPrice < minimumAmountHKD) {
        return res.status(400).json({
          error: `Minimum order amount is HKD ${minimumAmountHKD}. Current total: HKD ${totalPrice}`
        })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: orderItemsData.map(item => ({
          price_data: {
            currency: 'HKD',
            product_data: {
              name: item.productName,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${order.oid}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
        metadata: {
          orderId: order.oid.toString(),
          digest: digest
        }
      })

      // Update order with Stripe session ID
      await prisma.order.update({
        where: { oid: order.oid },
        data: { stripePaymentIntentId: session.id }
      })

      res.json({
        orderId: order.oid,
        digest,
        totalAmount: totalPrice,
        currency: 'HKD',
        stripeCheckoutUrl: session.url
      })

    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      // If Stripe fails, still return order info but without checkout URL
      res.json({
        orderId: order.oid,
        digest,
        totalAmount: totalPrice,
        currency: 'HKD',
        error: 'Stripe checkout session failed'
      })
    }

  } catch (err) {
    console.error('Order creation error:', err)
    res.status(500).json({ error: "Failed to create order" })
  }
})

// Get All Orders (Admin Only)
app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
        user: {
          select: {
            uid: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(orders)
  } catch (err) {
    console.error('Admin orders fetch error:', err)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
})

// Get User's Orders (Recent 5)
app.get("/api/user/orders", authenticateToken, async (req, res) => {
  try {
    const user = req.user as any

    const orders = await prisma.order.findMany({
      where: { uid: user.uid },
      include: {
        orderItems: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Limit to recent 5 orders
    })

    res.json(orders)
  } catch (err) {
    console.error('User orders fetch error:', err)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
})

// Get Order Details
app.get("/api/orders/:orderId", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params
    const user = req.user as any

    const order = await prisma.order.findUnique({
      where: { oid: parseInt(orderId) },
      include: {
        orderItems: true,
        user: {
          select: {
            uid: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    // Check if user owns this order or is admin
    if (order.uid !== user.uid && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" })
    }

    res.json(order)
  } catch (err) {
    console.error('Order fetch error:', err)
    res.status(500).json({ error: "Failed to fetch order" })
  }
})

// Test Webhook Endpoint (for development testing)
app.post('/api/test-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('TEST WEBHOOK: Received webhook event')
  console.log('Headers:', req.headers)
  console.log('Body:', req.body.toString())
  
  try {
    const event = JSON.parse(req.body.toString())
    console.log('Parsed event:', event.type, event.id)
    
    // If this is a checkout.session.completed event, process it
    if (event.type === 'checkout.session.completed') {
      console.log('TEST WEBHOOK: Processing checkout.session.completed')
      // You can manually call the webhook processing logic here
    }
    
    res.json({ received: true, event_type: event.type })
  } catch (err) {
    console.error('TEST WEBHOOK: Error parsing event:', err)
    res.status(400).json({ error: 'Invalid JSON' })
  }
})

// Stripe Webhook Endpoint for Payment Completion
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // For development, skip signature verification if webhook secret is not set properly
  let event: Stripe.Event
  
  if (webhookSecret && webhookSecret !== 'webhook') {
    // Proper webhook verification
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  } else {
    // Development mode: parse event without verification
    try {
      event = JSON.parse(req.body.toString())
      console.log('DEV MODE: Processing webhook without signature verification')
    } catch (err) {
      console.error('Failed to parse webhook event:', err)
      return res.status(400).send('Invalid JSON')
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        // Extract metadata
        const orderId = parseInt(session.metadata?.orderId || '0')
        const digest = session.metadata?.digest || ''
        
        if (!orderId || !digest) {
          console.error('Missing order metadata in webhook')
          return res.status(400).send('Missing order metadata')
        }

        // Check if transaction already processed
        const existingOrder = await prisma.order.findUnique({
          where: { oid: orderId }
        })

        if (!existingOrder) {
          console.error('Order not found:', orderId)
          return res.status(404).send('Order not found')
        }

        if (existingOrder.status === 'PAID') {
          console.log('Order already processed:', orderId)
          return res.status(200).send('Order already processed')
        }

        // Get order items to regenerate digest
        const orderItems = await prisma.orderItem.findMany({
          where: { oid: orderId },
          include: { product: true }
        })

        if (orderItems.length === 0) {
          console.error('No order items found for order:', orderId)
          return res.status(400).send('No order items found')
        }

        // Regenerate digest for validation
        const digestData = {
          currency: existingOrder.currency,
          merchantEmail: existingOrder.merchantEmail,
          salt: existingOrder.salt,
          items: orderItems.map(item => ({
            pid: item.pid,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName
          })),
          totalPrice: existingOrder.totalAmount
        }

        const regeneratedDigest = generateOrderDigest(digestData)

        // Validate digest against stored one
        if (regeneratedDigest !== digest) {
          console.error('Digest validation failed for order:', orderId)
          console.error('Expected:', digest)
          console.error('Generated:', regeneratedDigest)
          return res.status(400).send('Digest validation failed')
        }

        // Update order status to PAID
        await prisma.order.update({
          where: { oid: orderId },
          data: { 
            status: 'PAID',
            stripePaymentIntentId: session.payment_intent as string
          }
        })

        console.log('Payment completed successfully for order:', orderId)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).send('Webhook processed successfully')
  } catch (err) {
    console.error('Webhook processing error:', err)
    res.status(500).send('Webhook processing failed')
  }
})

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`)
})
