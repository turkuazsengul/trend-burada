-- Indexes for the lookup paths the JPA repositories actually walk today.
-- Picked by surveying *Repository finders, not guessed:
--
--   ProductRepository
--     findByCategoryIgnoreCase(...) / findByCategoryIgnoreCaseOrderByProductCodeAsc(...)
--     findBySellerEmailIgnoreCase(...) / …AndCategoryIgnoreCase…
--     findByProductCodeAndSellerEmailIgnoreCase(...)
--   OrderRepository      findByCustomerCode(customerCode, pageable)
--   FavoriteRepository   findByCustomerCode(customerCode[, pageable])
--   CartRepository       findByCustomerCode(customerCode)
--
-- IgnoreCase translates to WHERE LOWER(col) = LOWER(?) at the DB. A plain
-- btree on the raw column does NOT help that predicate; only a functional
-- index on LOWER(col) is consulted. That's why the catalog indexes here
-- index on LOWER(...) and the others — which already match exactly — index
-- the raw column.
--
-- product_code already has a unique constraint (uk922x4t…) which gives it
-- a unique btree, so findByProductCode is already index-served. Same for
-- carts.cart_code, orders.order_code, customers.customer_code,
-- customers.email, banner_code — all already indexed via UNIQUE.

-- Catalog: case-insensitive lookups by category and seller_email.
CREATE INDEX IF NOT EXISTS idx_products_category_lower
    ON catalog.products (LOWER(category));

CREATE INDEX IF NOT EXISTS idx_products_seller_email_lower
    ON catalog.products (LOWER(seller_email));

-- Customer-scoped feeds. customer_code is a varchar (the business code
-- the FE knows), not a UUID — JPA finders match on it, so a plain btree
-- is the right shape.
CREATE INDEX IF NOT EXISTS idx_orders_customer_code
    ON ordering.orders (customer_code);

CREATE INDEX IF NOT EXISTS idx_favorites_customer_code
    ON favorite.favorites (customer_code);

CREATE INDEX IF NOT EXISTS idx_carts_customer_code
    ON cart.carts (customer_code);
