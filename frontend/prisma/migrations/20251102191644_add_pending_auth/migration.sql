-- CreateTable
CREATE TABLE "PendingAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "phoneCodeHash" TEXT NOT NULL,
    "sessionString" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingAuth_phoneNumber_key" ON "PendingAuth"("phoneNumber");

-- CreateIndex
CREATE INDEX "PendingAuth_phoneNumber_idx" ON "PendingAuth"("phoneNumber");

-- CreateIndex
CREATE INDEX "PendingAuth_expiresAt_idx" ON "PendingAuth"("expiresAt");
