-- CreateTable
CREATE TABLE "Order" (
    "oid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "digest" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HKD',
    "merchantEmail" TEXT NOT NULL DEFAULT 'dick2452683247@gmail.com',
    "salt" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderItemId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "oid" INTEGER NOT NULL,
    "pid" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "productName" TEXT NOT NULL,
    CONSTRAINT "OrderItem_oid_fkey" FOREIGN KEY ("oid") REFERENCES "Order" ("oid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_pid_fkey" FOREIGN KEY ("pid") REFERENCES "Product" ("pid") ON DELETE RESTRICT ON UPDATE CASCADE
);
