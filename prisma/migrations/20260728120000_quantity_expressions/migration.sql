-- Current Inventory / For Purchase move from a single number to free text
-- in the same "<count> x <amount><unit>" grammar as the Quarterly Stocking
-- Quantity column (allowing multiple comma-separated components, e.g.
-- "1 x 1kg, 1 x 250g" for a stock split across containers). Postgres casts
-- any existing numeric value to its plain text form automatically (e.g.
-- 12 -> '12') - no data is lost, but a bare number like that won't match
-- the new grammar until it's retyped, since the old numbers didn't record
-- what unit/package they meant.
ALTER TABLE "QuarterEntry" ALTER COLUMN "currentInventory" TYPE TEXT USING "currentInventory"::text;
ALTER TABLE "QuarterEntry" ALTER COLUMN "forPurchase" TYPE TEXT USING "forPurchase"::text;
