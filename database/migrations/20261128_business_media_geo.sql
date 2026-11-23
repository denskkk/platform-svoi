-- Логотип, банер і мітка на карті для бізнесу (additive).
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS banner_url VARCHAR(255);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
