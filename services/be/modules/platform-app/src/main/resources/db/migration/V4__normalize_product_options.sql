-- Replace the four URL-encoded "||"-delimited blob columns on
-- catalog.products (size_options_json, color_options_json,
-- highlights_json, attributes_json) with proper relational tables.
--
-- This migration only creates the new tables. Backfill of existing rows
-- runs once on app startup via ProductOptionsBackfill (an idempotent
-- listener). Dropping the legacy *_json columns is deferred to a
-- follow-up migration so a rollback path exists during the transition.
--
-- Layout choices:
--   * Composite PK (product_id, position) so order is part of identity
--     and Hibernate's @OrderColumn writes are deterministic.
--   * ON DELETE CASCADE on the FK so deleting a product cleans up its
--     options without an orphan-removal hook in the entity layer.
--   * No standalone autonomous primary key (id UUID) because no other
--     row references these — they're owned by the parent product, the
--     entity is a value collection (@ElementCollection), not a first-class
--     entity with its own identity.

CREATE TABLE IF NOT EXISTS catalog.product_size_options (
    product_id  uuid NOT NULL,
    position    integer NOT NULL,
    value       character varying(64) NOT NULL,
    PRIMARY KEY (product_id, position),
    FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog.product_color_options (
    product_id  uuid NOT NULL,
    position    integer NOT NULL,
    name        character varying(64) NOT NULL,
    image_url   character varying(500),
    PRIMARY KEY (product_id, position),
    FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog.product_highlights (
    product_id  uuid NOT NULL,
    position    integer NOT NULL,
    value       character varying(255) NOT NULL,
    PRIMARY KEY (product_id, position),
    FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog.product_attributes (
    product_id  uuid NOT NULL,
    position    integer NOT NULL,
    label       character varying(64) NOT NULL,
    value       character varying(255) NOT NULL,
    PRIMARY KEY (product_id, position),
    FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE CASCADE
);
