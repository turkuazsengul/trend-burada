CREATE EXTENSION IF NOT EXISTS pgcrypto@@

CREATE SCHEMA IF NOT EXISTS customer@@
CREATE SCHEMA IF NOT EXISTS catalog@@
CREATE SCHEMA IF NOT EXISTS cart@@
CREATE SCHEMA IF NOT EXISTS ordering@@
CREATE SCHEMA IF NOT EXISTS favorite@@
CREATE SCHEMA IF NOT EXISTS promotion@@

CREATE OR REPLACE FUNCTION migrate_id_to_uuid(target_schema TEXT, target_table TEXT)
RETURNS VOID AS
$$
DECLARE
    current_type TEXT;
BEGIN
    SELECT data_type
    INTO current_type
    FROM information_schema.columns
    WHERE table_schema = target_schema
      AND table_name = target_table
      AND column_name = 'id';

    IF current_type IS NULL THEN
        RETURN;
    END IF;

    IF current_type <> 'uuid' THEN
        EXECUTE format('ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS id_uuid UUID', target_schema, target_table);
        EXECUTE format('UPDATE %I.%I SET id_uuid = COALESCE(id_uuid, gen_random_uuid())', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id_uuid SET DEFAULT gen_random_uuid()', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id_uuid SET NOT NULL', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', target_schema, target_table, target_table || '_pkey');
        EXECUTE format('ALTER TABLE %I.%I DROP COLUMN IF EXISTS id', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN id_uuid TO id', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I PRIMARY KEY (id)', target_schema, target_table, target_table || '_pkey');
    ELSE
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', target_schema, target_table);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id SET NOT NULL', target_schema, target_table);
    END IF;
END;
$$ LANGUAGE plpgsql@@

SELECT migrate_id_to_uuid('catalog', 'products')@@
SELECT migrate_id_to_uuid('customer', 'customers')@@
SELECT migrate_id_to_uuid('ordering', 'orders')@@
SELECT migrate_id_to_uuid('favorite', 'favorites')@@
SELECT migrate_id_to_uuid('cart', 'carts')@@
SELECT migrate_id_to_uuid('cart', 'cart_items')@@
SELECT migrate_id_to_uuid('promotion', 'promotion_banners')@@
SELECT migrate_id_to_uuid('public', 'auth_verification_codes')@@

DROP FUNCTION IF EXISTS migrate_id_to_uuid(TEXT, TEXT)@@

ALTER TABLE IF EXISTS ordering.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP@@
UPDATE ordering.orders
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL@@

ALTER TABLE IF EXISTS favorite.favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP@@
UPDATE favorite.favorites
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL@@

ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255) DEFAULT 'seller@trendburada.local'@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS old_price DOUBLE PRECISION DEFAULT 0@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS discount_rate INTEGER DEFAULT 0@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS color VARCHAR(64)@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS size VARCHAR(16)@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS free_cargo BOOLEAN DEFAULT FALSE@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS seller_score DOUBLE PRECISION DEFAULT 0@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS installment_text VARCHAR(64)@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS size_options_json TEXT@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS color_options_json TEXT@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS highlights_json TEXT@@
ALTER TABLE IF EXISTS catalog.products ADD COLUMN IF NOT EXISTS attributes_json TEXT@@
UPDATE catalog.products
SET seller_email = COALESCE(seller_email,
        CASE
            WHEN category IN ('elbise', 'tisort', 'gomlek', 'pantolon', 'ceket', 'triko') THEN 'seller@trendburada.local'
            WHEN category IN ('erkek-tisort', 'erkek-gomlek', 'jean', 'erkek-pantolon', 'sweatshirt', 'mont') THEN 'menswear@trendburada.local'
            WHEN category IN ('kiz-cocuk', 'erkek-cocuk', 'bebek-giyim', 'okul-kombinleri', 'esofman', 'tayt', 'spor-sutyeni', 'hoodie', 'kosu-urunleri', 'sneaker', 'bot', 'topuklu-ayakkabi', 'loafer', 'sandalet', 'canta', 'kemer', 'cuzdan', 'taki', 'sapka') THEN 'family.active@trendburada.local'
            ELSE 'seller@trendburada.local'
        END),
    old_price = COALESCE(old_price, 0),
    discount_rate = COALESCE(discount_rate, 0),
    rating = COALESCE(rating, 0),
    review_count = COALESCE(review_count, 0),
    free_cargo = COALESCE(free_cargo, FALSE),
    price = COALESCE(price, 0),
    fast_delivery = COALESCE(fast_delivery, FALSE),
    seller_score = COALESCE(seller_score, 0),
    installment_text = COALESCE(installment_text, 'Pesin fiyatina'),
    size_options_json = COALESCE(size_options_json, ''),
    color_options_json = COALESCE(color_options_json, ''),
    highlights_json = COALESCE(highlights_json, ''),
    attributes_json = COALESCE(attributes_json, '')
WHERE seller_email IS NULL
   OR old_price IS NULL
   OR discount_rate IS NULL
   OR rating IS NULL
   OR review_count IS NULL
   OR free_cargo IS NULL
   OR price IS NULL
   OR fast_delivery IS NULL
   OR seller_score IS NULL
   OR installment_text IS NULL
   OR size_options_json IS NULL
   OR color_options_json IS NULL
   OR highlights_json IS NULL
   OR attributes_json IS NULL@@

ALTER TABLE IF EXISTS promotion.promotion_banners ADD COLUMN IF NOT EXISTS description VARCHAR(500)@@
ALTER TABLE IF EXISTS promotion.promotion_banners ADD COLUMN IF NOT EXISTS block_type VARCHAR(32)@@
ALTER TABLE IF EXISTS promotion.promotion_banners ADD COLUMN IF NOT EXISTS sort_order INTEGER@@

-- ---------------------------------------------------------------------------
-- customer.addresses
-- Saved delivery / mailing addresses for customers. Created idempotently so
-- this script can run on every boot (matches the rest of init-schemas.sql).
-- The FK to customer.customers(id) is ON DELETE CASCADE so a customer wipe
-- also removes their address rows; the partial unique index enforces
-- "at most one default address per customer".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer.addresses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID NOT NULL REFERENCES customer.customers(id) ON DELETE CASCADE,
    title         VARCHAR(60)  NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    phone         VARCHAR(30)  NOT NULL,
    country       VARCHAR(60)  NOT NULL,
    city          VARCHAR(60)  NOT NULL,
    district      VARCHAR(60)  NOT NULL,
    neighborhood  VARCHAR(80),
    address_line  VARCHAR(500) NOT NULL,
    postal_code   VARCHAR(20),
    is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
)@@

CREATE INDEX IF NOT EXISTS idx_addresses_customer_id
    ON customer.addresses (customer_id)@@

CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_one_default_per_customer
    ON customer.addresses (customer_id) WHERE is_default = TRUE@@
