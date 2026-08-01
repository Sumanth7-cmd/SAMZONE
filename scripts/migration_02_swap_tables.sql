-- SAMZONE products table migration, part 2 of 2.
-- Run this ONLY after Claude confirms the sampled Amazon dataset has been
-- imported into `products_new` and spot-checked.
--
-- This swaps the new table into place as `products` and renames the old
-- Kaggle fashion table to a timestamped backup rather than dropping it, so
-- it can still be recovered if anything looks wrong after the swap.

begin;

alter table products rename to products_old_backup_20260719;
alter table products_new rename to products;

commit;

-- Once you've confirmed /shop loads correctly with the new data, you can
-- permanently remove the backup with:
--   drop table products_old_backup_20260719;
