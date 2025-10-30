-- AlterTable
-- Make city field optional in User table to allow registration without city
ALTER TABLE "User" ALTER COLUMN "city" DROP NOT NULL;

-- AlterTable  
-- Make city field optional in Service table to allow services without city
ALTER TABLE "Service" ALTER COLUMN "city" DROP NOT NULL;
