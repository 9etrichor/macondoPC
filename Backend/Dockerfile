# Build stage
FROM node:20-bullseye AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Runtime stage
FROM node:20-bullseye

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY .env ./

# Directory for SQLite DB and uploads
VOLUME ["/app/uploads", "/app/prisma"]

EXPOSE 4000

CMD ["node", "dist/index.js"]
