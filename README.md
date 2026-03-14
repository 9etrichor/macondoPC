# macondoPC

A simple e-commerce website with a React frontend and Express/Prisma backend.

---

## Project structure

```
macondoPC/
├─ Backend/
│  ├─ src/
│  │  └─ index.ts          # Express server with APIs and image uploads
│  ├─ prisma/
│  │  ├─ schema.prisma     # Prisma DB schema (categories, products)
│  │  └─ seed.ts          # Initial data script
│  ├─ .env                # Environment variables (PORT, DATABASE_URL, UPLOAD_DIR)
│  ├─ Dockerfile
│  └─ docker-compose.yml
└─ Frontend/
   ├─ src/
   │  ├─ components/
   │  │  └─ TopBar.tsx       # Header nav + cart UI
   │  ├─ context/
   │  │  └─ CartContext.tsx    # Shopping cart state + localStorage
   │  └─ pages/
   │      ├─ Products.tsx
   │      ├─ Product.tsx
   │      └─ Admin.tsx
   ├─ .env.development          # VITE_API_BASE=http://localhost:4000
   ├─ .env.production           # VITE_API_BASE=http://s01.ierg4210.iecuhk.cc
   └─ package.json
```

---

## Quick start (local development)

### Backend

1. **Install dependencies**

   ```bash
   cd Backend
   npm install
   ```

2. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Apply migrations (creates dev.db)
   npx prisma migrate dev --name init

   # Seed initial categories and products
   npx ts-node prisma/seed.ts
   ```

3. **Run the server**

   ```bash
   # Option A: use Node
   npm run dev

   # Option B: use Docker
   docker-compose up --build
   ```

   The backend will be available at **http://localhost:4000**.

---

### Frontend

1. **Install dependencies**

   ```bash
   cd Frontend
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm run dev
   ```

   The frontend will be available at **http://localhost:5173** (or another port Vite prints).

---

## How it works

- **Frontend** reads `VITE_API_BASE` from `.env` files:
  - `.env.development` → `http://localhost:4000`
  - `.env.production` → your deployed backend URL
- **Backend** uses `cors()` to allow all origins.
- **Cart** is persisted to `localStorage` as `{ pid, quantity }[]` and restored by fetching product names/prices from the backend on app load.

---

## Deployment notes

- **Backend**: Deploy with Docker (or Node) and expose port 80 or 4000.  
  Ensure `DATABASE_URL` and `UPLOAD_DIR` environment variables are set.
- **Frontend**: Build and host on your domain; set `VITE_API_BASE` to the deployed backend URL.
- **Database**: Include `Backend/dev.db` (or run `prisma migrate dev && npx ts-node prisma/seed.ts`) to recreate from schema+seed.

---

## Common commands

```bash
# Backend
cd Backend
npm run dev          # start dev server
npx prisma studio    # open DB browser
npx prisma generate   # regenerate client after schema change
npx prisma migrate dev # apply schema changes

# Frontend
cd Frontend
npm run dev          # start dev server
npm run build         # build for production
```

//below is for me
I edit the docker-compose.yml in deploy server
I change the Base URL in frontend admin, products and product component in deploy server