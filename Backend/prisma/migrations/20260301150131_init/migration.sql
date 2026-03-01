-- CreateTable
CREATE TABLE "Category" (
    "catid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "pid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "imagePath" TEXT,
    "catid" INTEGER NOT NULL,
    CONSTRAINT "Product_catid_fkey" FOREIGN KEY ("catid") REFERENCES "Category" ("catid") ON DELETE RESTRICT ON UPDATE CASCADE
);
