-- Agronomist workflow, request timeline, insight history, farm passport id.
CREATE TYPE "AgronomistStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "RequestEventType" AS ENUM ('REQUEST_CREATED','REQUEST_REVIEWED','AGRONOMIST_ASSIGNED','ASSESSMENT_SUBMITTED','REQUEST_COMPLETED','REQUEST_CANCELLED');

ALTER TABLE "Farm" ADD COLUMN "publicId" TEXT;
UPDATE "Farm" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
ALTER TABLE "Farm" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Farm_publicId_key" ON "Farm"("publicId");

CREATE TABLE "Agronomist" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "county" TEXT,
  "specialties" "ServiceType"[],
  "status" "AgronomistStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Agronomist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Agronomist_email_key" ON "Agronomist"("email");
CREATE INDEX "Agronomist_status_idx" ON "Agronomist"("status");

ALTER TABLE "ServiceRequest" ADD COLUMN "assignedAgronomistId" TEXT, ADD COLUMN "assignedAt" TIMESTAMP(3);
CREATE INDEX "ServiceRequest_assignedAgronomistId_status_idx" ON "ServiceRequest"("assignedAgronomistId","status");
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedAgronomistId_fkey" FOREIGN KEY ("assignedAgronomistId") REFERENCES "Agronomist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AgronomistAssessment" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "agronomistId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "observations" TEXT,
  "recommendedActions" TEXT,
  "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
  "followUpDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgronomistAssessment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AgronomistAssessment_serviceRequestId_key" ON "AgronomistAssessment"("serviceRequestId");
CREATE INDEX "AgronomistAssessment_agronomistId_idx" ON "AgronomistAssessment"("agronomistId");
CREATE INDEX "AgronomistAssessment_followUpRequired_followUpDate_idx" ON "AgronomistAssessment"("followUpRequired","followUpDate");
ALTER TABLE "AgronomistAssessment" ADD CONSTRAINT "AgronomistAssessment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgronomistAssessment" ADD CONSTRAINT "AgronomistAssessment_agronomistId_fkey" FOREIGN KEY ("agronomistId") REFERENCES "Agronomist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ServiceRequestEvent" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "type" "RequestEventType" NOT NULL,
  "fromStatus" "RequestStatus",
  "toStatus" "RequestStatus",
  "actorRole" TEXT NOT NULL,
  "actorName" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceRequestEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ServiceRequestEvent_serviceRequestId_createdAt_idx" ON "ServiceRequestEvent"("serviceRequestId","createdAt");
ALTER TABLE "ServiceRequestEvent" ADD CONSTRAINT "ServiceRequestEvent_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FarmInsightSnapshot" (
  "id" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "opportunityScore" INTEGER NOT NULL,
  "healthStatus" "HealthStatus" NOT NULL,
  "scoreBreakdown" JSONB,
  "recommendations" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FarmInsightSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FarmInsightSnapshot_farmId_createdAt_idx" ON "FarmInsightSnapshot"("farmId","createdAt");
ALTER TABLE "FarmInsightSnapshot" ADD CONSTRAINT "FarmInsightSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
