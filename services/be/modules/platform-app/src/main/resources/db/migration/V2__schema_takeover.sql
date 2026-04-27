-- Schema takeover.
--
-- Captures the schema that the previous ddl-auto=update + spring.sql.init
-- (init-schemas.sql) era left in the database. From this point forward
-- Hibernate runs in validate mode and Flyway is the only thing that
-- mutates the schema.
--
-- Every statement is idempotent so the migration can run safely on:
--   * fresh databases (creates everything),
--   * existing databases that already carry this exact schema (no-op).
--
-- Constraint names are kept as Hibernate auto-generated them
-- (`ukb2krq2ko8nu243ly9tjuh8929`, …) because the existing dev / prod
-- databases already carry those names and validate mode does not check
-- constraint names — only that the columns and types match the entities.
-- Renaming them to friendlier names is a separate, dedicated migration.
--
-- The Hibernate-generated `flyway_schema_history` table is intentionally
-- not declared here; Flyway manages it itself.

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Schemas ──────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS cart;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS customer;
CREATE SCHEMA IF NOT EXISTS favorite;
CREATE SCHEMA IF NOT EXISTS ordering;
CREATE SCHEMA IF NOT EXISTS promotion;

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart.cart_items (
    cart_code     character varying(64) NOT NULL,
    product_code  character varying(64) NOT NULL,
    quantity      integer NOT NULL,
    unit_price    double precision NOT NULL,
    id            uuid DEFAULT gen_random_uuid() NOT NULL
);

CREATE TABLE IF NOT EXISTS cart.carts (
    cart_code      character varying(64) NOT NULL,
    customer_code  character varying(64) NOT NULL,
    id             uuid DEFAULT gen_random_uuid() NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog.products (
    brand               character varying(100) NOT NULL,
    category            character varying(100) NOT NULL,
    fast_delivery       boolean NOT NULL,
    price               double precision NOT NULL,
    product_code        character varying(64) NOT NULL,
    title               character varying(255) NOT NULL,
    image_url           character varying(500),
    color               character varying(64),
    discount_rate       integer,
    installment_text    character varying(64),
    old_price           double precision,
    rating              double precision,
    review_count        integer,
    seller_score        double precision,
    size                character varying(16),
    free_cargo          boolean DEFAULT false,
    size_options_json   text,
    color_options_json  text,
    highlights_json     text,
    attributes_json     text,
    id                  uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_email        character varying(255) DEFAULT 'seller@trendburada.local'
);

CREATE TABLE IF NOT EXISTS customer.customers (
    customer_code        character varying(64) NOT NULL,
    email                character varying(255) NOT NULL,
    full_name            character varying(120) NOT NULL,
    preferred_category   character varying(50) NOT NULL,
    segment              character varying(50) NOT NULL,
    id                   uuid DEFAULT gen_random_uuid() NOT NULL,
    birth_date           date,
    gender               character varying(16),
    phone                character varying(30)
);

CREATE TABLE IF NOT EXISTS customer.addresses (
    id            uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id   uuid NOT NULL,
    title         character varying(60)  NOT NULL,
    full_name     character varying(120) NOT NULL,
    phone         character varying(30)  NOT NULL,
    country       character varying(60)  NOT NULL,
    city          character varying(60)  NOT NULL,
    district      character varying(60)  NOT NULL,
    neighborhood  character varying(80),
    address_line  character varying(500) NOT NULL,
    postal_code   character varying(20),
    is_default    boolean      DEFAULT false NOT NULL,
    created_at    timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS favorite.favorites (
    customer_code  character varying(64) NOT NULL,
    product_code   character varying(64) NOT NULL,
    id             uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at     timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordering.orders (
    customer_code  character varying(64) NOT NULL,
    order_code     character varying(64) NOT NULL,
    status         character varying(50) NOT NULL,
    total_amount   double precision NOT NULL,
    id             uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at     timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion.promotion_banners (
    banner_code   character varying(64)  NOT NULL,
    image_url     character varying(500) NOT NULL,
    target_path   character varying(255) NOT NULL,
    title         character varying(150) NOT NULL,
    block_type    character varying(32),
    description   character varying(500),
    sort_order    integer,
    id            uuid DEFAULT gen_random_uuid() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.auth_verification_codes (
    code         character varying(16)  NOT NULL,
    consumed_at  timestamp(6) with time zone,
    created_at   timestamp(6) with time zone NOT NULL,
    email        character varying(255) NOT NULL,
    expires_at   timestamp(6) with time zone NOT NULL,
    user_id      character varying(64)  NOT NULL,
    id           uuid DEFAULT gen_random_uuid() NOT NULL
);

-- ── Constraints ──────────────────────────────────────────────────────────────
-- ALTER TABLE ADD CONSTRAINT lacks IF NOT EXISTS in PostgreSQL, so each one
-- is wrapped in a DO block that swallows the duplicate_object error. The
-- ugly Hibernate-generated names (ukb2krq2ko..., uk922x4t...) are the names
-- the existing databases already carry.

DO $$ BEGIN
    ALTER TABLE cart.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE cart.carts ADD CONSTRAINT carts_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE cart.carts ADD CONSTRAINT ukb2krq2ko8nu243ly9tjuh8929 UNIQUE (cart_code);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE catalog.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE catalog.products ADD CONSTRAINT uk922x4t23nx64422orei4meb2y UNIQUE (product_code);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE customer.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE customer.customers ADD CONSTRAINT ukiqv746oh5t5is1vr4p2nl79r6 UNIQUE (customer_code);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE customer.customers ADD CONSTRAINT ukrfbvkrffamfql7cjmen8v976v UNIQUE (email);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE customer.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE customer.addresses ADD CONSTRAINT addresses_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE favorite.favorites ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ordering.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ordering.orders ADD CONSTRAINT ukdhk2umg8ijjkg4njg6891trit UNIQUE (order_code);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE promotion.promotion_banners ADD CONSTRAINT promotion_banners_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE promotion.promotion_banners ADD CONSTRAINT ukq5poe6cn0wp2ykqdlh9nq1q4b UNIQUE (banner_code);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.auth_verification_codes ADD CONSTRAINT auth_verification_codes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
END $$;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id
    ON customer.addresses (customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_one_default_per_customer
    ON customer.addresses (customer_id) WHERE (is_default = TRUE);
