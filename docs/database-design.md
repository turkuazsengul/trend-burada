# Database Design

## Current database strategy

TrendBurada backend currently uses a single PostgreSQL database for the modular monolith runtime.

Schemas:

- `customer`
- `catalog`
- `cart`
- `ordering`
- `favorite`
- `promotion`

Schema bootstrap is executed from:

- [init-schemas.sql](/Users/turkuzsengul/DEV/trend-burada-be/modules/platform-app/src/main/resources/db/init-schemas.sql)

## Tables

### `customer.customers`

- `id`
- `customer_code`
- `full_name`
- `email`
- `segment`
- `preferred_category`

### `catalog.products`

- `id`
- `product_code`
- `title`
- `category`
- `brand`
- `price`
- `fast_delivery`

### `cart.carts`

- `id`
- `cart_code`
- `customer_code`

### `cart.cart_items`

- `id`
- `cart_code`
- `product_code`
- `quantity`
- `unit_price`

### `ordering.orders`

- `id`
- `order_code`
- `customer_code`
- `status`
- `total_amount`

### `favorite.favorites`

- `id`
- `customer_code`
- `product_code`

### `promotion.promotion_banners`

- `id`
- `banner_code`
- `title`
- `image_url`
- `target_path`

### Auth persistence

Auth verification codes are currently stored by JPA in the default schema table:

- `auth_verification_codes`

## Notes

- This is enough for local testing and Postman validation
- Production migration tooling should move to `Flyway`
- Domain extraction into separate services can later split these schemas into isolated databases
