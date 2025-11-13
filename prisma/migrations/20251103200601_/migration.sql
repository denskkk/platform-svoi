/*
  Warnings:

  - You are about to drop the column `education` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('guest', 'basic', 'extended', 'business', 'business_premium');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('secondary', 'college', 'bachelor', 'master', 'doctorate');

-- CreateEnum
CREATE TYPE "FOPGroup" AS ENUM ('group1', 'group2', 'group3');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('fop', 'tov', 'other');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('job', 'partner', 'service', 'product', 'investor', 'employee', 'other');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('active', 'in_progress', 'completed', 'cancelled');

-- DropIndex
DROP INDEX "users_city_role_idx";

-- DropIndex
DROP INDEX "users_first_name_last_name_idx";

-- DropIndex
DROP INDEX "users_is_active_idx";

-- AlterTable
ALTER TABLE "business_info" ADD COLUMN     "business_category" VARCHAR(100),
ADD COLUMN     "company_code" VARCHAR(50),
ADD COLUMN     "company_type" "CompanyType",
ADD COLUMN     "fop_group" "FOPGroup",
ADD COLUMN     "offer_to_customers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_to_investors" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_to_partners" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offer_type" VARCHAR(50),
ADD COLUMN     "seeking_criteria" JSONB DEFAULT '{}',
ADD COLUMN     "seeking_customer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seeking_employee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seeking_investor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seeking_partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wants_ucm_analysis" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "education",
ADD COLUMN     "account_type" "AccountType" NOT NULL DEFAULT 'basic',
ADD COLUMN     "beauty_services" JSONB DEFAULT '{}',
ADD COLUMN     "car_services" JSONB DEFAULT '{}',
ADD COLUMN     "children_ages" JSONB DEFAULT '[]',
ADD COLUMN     "cuisine_preference" VARCHAR(100),
ADD COLUMN     "education_details" TEXT,
ADD COLUMN     "education_level" "EducationLevel",
ADD COLUMN     "housing_details" JSONB DEFAULT '{}',
ADD COLUMN     "ready_to_switch_ucm" BOOLEAN,
ADD COLUMN     "restaurant_frequency" VARCHAR(50),
ADD COLUMN     "seeking_full_time" BOOLEAN,
ADD COLUMN     "seeking_part_time" BOOLEAN,
ADD COLUMN     "subscription_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN     "subscription_started_at" TIMESTAMP(3),
ADD COLUMN     "ucm_member" BOOLEAN,
ADD COLUMN     "ucm_supporter" BOOLEAN,
ADD COLUMN     "uses_business_services" JSONB DEFAULT '{}',
ADD COLUMN     "uses_delivery" BOOLEAN,
ADD COLUMN     "uses_services" JSONB DEFAULT '{}',
ADD COLUMN     "wants_start_business" BOOLEAN,
ADD COLUMN     "work_history" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "requests" (
    "request_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'active',
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "category_id" INTEGER,
    "budget_from" DECIMAL(10,2),
    "budget_to" DECIMAL(10,2),
    "deadline_at" TIMESTAMP(3),
    "criteria" JSONB DEFAULT '{}',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "responses_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "request_responses" (
    "response_id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "timeframe" VARCHAR(100),
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_at" TIMESTAMP(3),

    CONSTRAINT "request_responses_pkey" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscription_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'UAH',
    "payment_method" VARCHAR(50),
    "transaction_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateIndex
CREATE INDEX "requests_user_id_idx" ON "requests"("user_id");

-- CreateIndex
CREATE INDEX "requests_type_idx" ON "requests"("type");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_city_idx" ON "requests"("city");

-- CreateIndex
CREATE INDEX "requests_category_id_idx" ON "requests"("category_id");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at" DESC);

-- CreateIndex
CREATE INDEX "request_responses_request_id_idx" ON "request_responses"("request_id");

-- CreateIndex
CREATE INDEX "request_responses_user_id_idx" ON "request_responses"("user_id");

-- CreateIndex
CREATE INDEX "request_responses_is_accepted_idx" ON "request_responses"("is_accepted");

-- CreateIndex
CREATE INDEX "request_responses_created_at_idx" ON "request_responses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_accountType_idx" ON "subscriptions"("accountType");

-- CreateIndex
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions"("expires_at");

-- CreateIndex
CREATE INDEX "business_info_business_category_idx" ON "business_info"("business_category");

-- CreateIndex
CREATE INDEX "business_info_company_type_idx" ON "business_info"("company_type");

-- CreateIndex
CREATE INDEX "users_account_type_idx" ON "users"("account_type");

-- CreateIndex
CREATE INDEX "users_employment_status_idx" ON "users"("employment_status");

-- CreateIndex
CREATE INDEX "users_subscription_active_idx" ON "users"("subscription_active");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_responses" ADD CONSTRAINT "request_responses_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_responses" ADD CONSTRAINT "request_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
