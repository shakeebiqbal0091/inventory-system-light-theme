-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "businessName" TEXT,
    "businessEmail" TEXT,
    "businessPhone" TEXT,
    "businessAddress" TEXT,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "salesNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
