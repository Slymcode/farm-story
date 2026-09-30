-- CreateEnum
CREATE TYPE "CropType" AS ENUM ('COFFEE', 'MAIZE', 'BEANS', 'TEA', 'OTHER');
CREATE TYPE "Challenge" AS ENUM ('LOW_YIELD', 'PESTS_DISEASE', 'SOIL_QUALITY', 'WATER_AVAILABILITY', 'BUYER_ACCESS', 'FINANCE_ACCESS', 'INPUT_COSTS');
CREATE TYPE "ServiceType" AS ENUM ('AGRONOMIST_VISIT', 'SOIL_TEST', 'BIOCHAR_ASSESSMENT', 'COFFEE_QUALITY_ASSESSMENT', 'BUYER_OFFTAKE_SUPPORT');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "HealthStatus" AS ENUM ('STRONG_POSITION', 'MODERATE_OPPORTUNITY', 'HIGH_OPPORTUNITY');

-- CreateTable
CREATE TABLE "Counter" ("name" TEXT NOT NULL, "value" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "Counter_pkey" PRIMARY KEY ("name"));

CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL, "farmerId" TEXT NOT NULL, "fullName" TEXT NOT NULL, "mobileNumber" TEXT NOT NULL, "email" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Kenya', "county" TEXT NOT NULL, "region" TEXT, "preferredLanguage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Farm" (
    "id" TEXT NOT NULL, "farmerId" TEXT NOT NULL, "farmName" TEXT NOT NULL, "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL, "longitude" DOUBLE PRECISION NOT NULL, "sizeAcres" DOUBLE PRECISION NOT NULL,
    "primaryCrop" "CropType" NOT NULL, "coffeeVariety" TEXT[], "coffeeTrees" INTEGER, "estimatedAnnualProductionKg" DOUBLE PRECISION,
    "lastHarvestDate" TIMESTAMP(3), "lastSoilTestDate" TIMESTAMP(3), "challenges" "Challenge"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FarmInsight" (
    "id" TEXT NOT NULL, "farmId" TEXT NOT NULL, "opportunityScore" INTEGER NOT NULL, "healthStatus" "HealthStatus" NOT NULL,
    "summary" TEXT NOT NULL, "insights" JSONB NOT NULL, "recommendations" JSONB NOT NULL, "scoreBreakdown" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FarmInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL, "requestId" TEXT NOT NULL, "farmerId" TEXT NOT NULL, "farmId" TEXT NOT NULL, "type" "ServiceType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING', "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_farmerId_key" ON "Farmer"("farmerId");
CREATE INDEX "Farmer_county_idx" ON "Farmer"("county");
CREATE INDEX "Farmer_createdAt_idx" ON "Farmer"("createdAt");
CREATE INDEX "Farm_farmerId_idx" ON "Farm"("farmerId");
CREATE INDEX "Farm_primaryCrop_idx" ON "Farm"("primaryCrop");
CREATE INDEX "Farm_createdAt_idx" ON "Farm"("createdAt");
CREATE UNIQUE INDEX "FarmInsight_farmId_key" ON "FarmInsight"("farmId");
CREATE UNIQUE INDEX "ServiceRequest_requestId_key" ON "ServiceRequest"("requestId");
CREATE INDEX "ServiceRequest_farmerId_idx" ON "ServiceRequest"("farmerId");
CREATE INDEX "ServiceRequest_farmId_idx" ON "ServiceRequest"("farmId");
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FarmInsight" ADD CONSTRAINT "FarmInsight_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
