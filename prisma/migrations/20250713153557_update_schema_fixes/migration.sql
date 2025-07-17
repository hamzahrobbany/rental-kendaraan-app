/*
  Warnings:

  - The values [Bensin,Diesel,Listrik,Hybrid] on the enum `FuelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BANK_TRANSFER_OTOMATIS] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Order` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FuelType_new" AS ENUM ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID');
ALTER TABLE "Vehicle" ALTER COLUMN "fuelType" TYPE "FuelType_new" USING ("fuelType"::text::"FuelType_new");
ALTER TYPE "FuelType" RENAME TO "FuelType_old";
ALTER TYPE "FuelType_new" RENAME TO "FuelType";
DROP TYPE "FuelType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('BANK_TRANSFER_MANUAL', 'BANK_TRANSFER_AUTOMATIC', 'CREDIT_CARD', 'E_WALLET');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
DROP COLUMN "totalAmount",
ADD COLUMN     "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "totalPrice" DECIMAL(10,2),
ALTER COLUMN "rentalDays" DROP NOT NULL,
ALTER COLUMN "depositAmount" DROP NOT NULL,
ALTER COLUMN "remainingAmount" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "mainImageUrl" DROP NOT NULL,
ALTER COLUMN "city" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_vehicleId_idx" ON "Order"("vehicleId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_vehicleId_idx" ON "Review"("vehicleId");
