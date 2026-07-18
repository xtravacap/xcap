-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LENDER', 'BORROWER');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('BRIDGE', 'DSCR', 'CONSTRUCTION', 'GROUND_UP', 'FIX_AND_FLIP', 'PERMANENT', 'MEZZANINE', 'VALUE_ADD', 'RENTAL_PORTFOLIO', 'MIXED_USE_FINANCING');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('MULTIFAMILY', 'MIXED_USE', 'RETAIL', 'OFFICE', 'INDUSTRIAL', 'SELF_STORAGE', 'HOSPITALITY', 'LAND', 'SINGLE_FAMILY', 'WAREHOUSE', 'MEDICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RecourseType" AS ENUM ('RECOURSE', 'NON_RECOURSE', 'EITHER');

-- CreateEnum
CREATE TYPE "LoanPurpose" AS ENUM ('PURCHASE', 'REFINANCE', 'CASH_OUT', 'CONSTRUCTION', 'BRIDGE', 'DSCR', 'FIX_AND_FLIP', 'GROUND_UP');

-- CreateEnum
CREATE TYPE "OccupancyType" AS ENUM ('OWNER_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT', 'MIXED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'MATCHED', 'INTRODUCED', 'IN_UNDERWRITING', 'CLOSED_WON', 'CLOSED_LOST', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'REJECTED', 'INTRODUCED', 'RESPONDED', 'DECLINED_BY_LENDER', 'FUNDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_CONTRACT', 'RENT_ROLL', 'FINANCIALS', 'TAX_RETURNS', 'BANK_STATEMENTS', 'APPRAISAL', 'PHOTOS', 'EXECUTIVE_SUMMARY', 'OPERATING_STATEMENT', 'LENDER_MATRIX', 'LENDER_GUIDELINES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_RECEIVED', 'LENDER_MATCHED', 'DOCUMENT_UPLOADED', 'STATUS_CHANGED', 'ADMIN_COMMENT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BORROWER',
    "organizationId" TEXT NOT NULL,
    "lenderId" TEXT,
    "borrowerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lenders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "primaryContact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "loanTypes" "LoanType"[],
    "propertyTypes" "PropertyType"[],
    "states" TEXT[],
    "minLoanAmount" DECIMAL(14,2) NOT NULL,
    "maxLoanAmount" DECIMAL(14,2) NOT NULL,
    "maxLtc" DOUBLE PRECISION,
    "maxLtv" DOUBLE PRECISION,
    "minDscr" DOUBLE PRECISION,
    "minCreditScore" INTEGER,
    "recourse" "RecourseType" NOT NULL DEFAULT 'EITHER',
    "interestRateMin" DOUBLE PRECISION,
    "interestRateMax" DOUBLE PRECISION,
    "originationFeeMin" DOUBLE PRECISION,
    "originationFeeMax" DOUBLE PRECISION,
    "allowsBridge" BOOLEAN NOT NULL DEFAULT false,
    "allowsDscr" BOOLEAN NOT NULL DEFAULT false,
    "allowsConstruction" BOOLEAN NOT NULL DEFAULT false,
    "allowsGroundUp" BOOLEAN NOT NULL DEFAULT false,
    "allowsFixFlip" BOOLEAN NOT NULL DEFAULT false,
    "allowsMultifamily" BOOLEAN NOT NULL DEFAULT false,
    "allowsMixedUse" BOOLEAN NOT NULL DEFAULT false,
    "allowsRetail" BOOLEAN NOT NULL DEFAULT false,
    "allowsOffice" BOOLEAN NOT NULL DEFAULT false,
    "allowsIndustrial" BOOLEAN NOT NULL DEFAULT false,
    "allowsSelfStorage" BOOLEAN NOT NULL DEFAULT false,
    "allowsHospitality" BOOLEAN NOT NULL DEFAULT false,
    "allowsLand" BOOLEAN NOT NULL DEFAULT false,
    "preferredMarkets" TEXT[],
    "requiredExperienceYears" INTEGER,
    "sponsorNetWorthRequirement" DECIMAL(14,2),
    "liquidityRequirement" DECIMAL(14,2),
    "entityRequirements" TEXT,
    "prepaymentPenalty" TEXT,
    "closingTimelineDays" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_programs" (
    "id" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "loanType" "LoanType" NOT NULL,
    "purposes" "LoanPurpose"[],
    "minLoanAmount" DECIMAL(14,2) NOT NULL,
    "maxLoanAmount" DECIMAL(14,2) NOT NULL,
    "minDscr" DOUBLE PRECISION,
    "maxLtv" DOUBLE PRECISION,
    "maxLtc" DOUBLE PRECISION,
    "interestRateMin" DOUBLE PRECISION,
    "interestRateMax" DOUBLE PRECISION,
    "termMonths" INTEGER,
    "amortizationMonths" INTEGER,
    "prepayment" TEXT,
    "interestOnly" BOOLEAN NOT NULL DEFAULT false,
    "propertyTypes" "PropertyType"[],
    "allowedStates" TEXT[],
    "isBridge" BOOLEAN NOT NULL DEFAULT false,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "isConstruction" BOOLEAN NOT NULL DEFAULT false,
    "isValueAdd" BOOLEAN NOT NULL DEFAULT false,
    "isGroundUp" BOOLEAN NOT NULL DEFAULT false,
    "isFixFlip" BOOLEAN NOT NULL DEFAULT false,
    "isRentalPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "isCommercial" BOOLEAN NOT NULL DEFAULT false,
    "isResidential" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT,
    "entityType" TEXT,
    "experienceYears" INTEGER,
    "creditScore" INTEGER,
    "liquidity" DECIMAL(14,2),
    "netWorth" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_requests" (
    "id" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "requestedLoanAmount" DECIMAL(14,2) NOT NULL,
    "purchasePrice" DECIMAL(14,2),
    "propertyValue" DECIMAL(14,2),
    "ltv" DOUBLE PRECISION,
    "ltc" DOUBLE PRECISION,
    "dscr" DOUBLE PRECISION,
    "noi" DECIMAL(14,2),
    "capRate" DOUBLE PRECISION,
    "propertyAddress" TEXT NOT NULL,
    "propertyCity" TEXT,
    "propertyState" TEXT NOT NULL,
    "propertyZip" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "occupancy" "OccupancyType",
    "loanPurpose" "LoanPurpose" NOT NULL,
    "timelineDays" INTEGER,
    "closingDate" TIMESTAMP(3),
    "exitStrategy" TEXT,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "loanRequestId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "loanProgramId" TEXT,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "overriddenById" TEXT,
    "overrideNote" TEXT,
    "introducedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "loanRequestId" TEXT,
    "lenderId" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" TEXT,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "loanRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedLoanRequestId" TEXT,
    "relatedMatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_lenderId_key" ON "users"("lenderId");

-- CreateIndex
CREATE UNIQUE INDEX "users_borrowerId_key" ON "users"("borrowerId");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "lenders_organizationId_idx" ON "lenders"("organizationId");

-- CreateIndex
CREATE INDEX "lenders_minLoanAmount_maxLoanAmount_idx" ON "lenders"("minLoanAmount", "maxLoanAmount");

-- CreateIndex
CREATE INDEX "loan_programs_lenderId_idx" ON "loan_programs"("lenderId");

-- CreateIndex
CREATE INDEX "loan_programs_loanType_idx" ON "loan_programs"("loanType");

-- CreateIndex
CREATE INDEX "borrowers_organizationId_idx" ON "borrowers"("organizationId");

-- CreateIndex
CREATE INDEX "loan_requests_borrowerId_idx" ON "loan_requests"("borrowerId");

-- CreateIndex
CREATE INDEX "loan_requests_status_idx" ON "loan_requests"("status");

-- CreateIndex
CREATE INDEX "loan_requests_propertyState_idx" ON "loan_requests"("propertyState");

-- CreateIndex
CREATE INDEX "matches_loanRequestId_score_idx" ON "matches"("loanRequestId", "score");

-- CreateIndex
CREATE INDEX "matches_lenderId_idx" ON "matches"("lenderId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_loanRequestId_loanProgramId_key" ON "matches"("loanRequestId", "loanProgramId");

-- CreateIndex
CREATE INDEX "documents_loanRequestId_idx" ON "documents"("loanRequestId");

-- CreateIndex
CREATE INDEX "documents_lenderId_idx" ON "documents"("lenderId");

-- CreateIndex
CREATE INDEX "comments_loanRequestId_idx" ON "comments"("loanRequestId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "activity_log_organizationId_createdAt_idx" ON "activity_log"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "lenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lenders" ADD CONSTRAINT "lenders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_programs" ADD CONSTRAINT "loan_programs_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_loanRequestId_fkey" FOREIGN KEY ("loanRequestId") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_loanProgramId_fkey" FOREIGN KEY ("loanProgramId") REFERENCES "loan_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_loanRequestId_fkey" FOREIGN KEY ("loanRequestId") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_loanRequestId_fkey" FOREIGN KEY ("loanRequestId") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
