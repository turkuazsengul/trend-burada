# TrendBurada Backend Architecture Proposal

## 1. Frontend analysis summary

This frontend already implies the following business domains:

- Authentication and registration
- Customer profile and account management
- Product catalog and category listing
- Search
- Favorites
- Cart
- Orders
- Address book
- Campaigns and promos
- AI Shop outfit/combo generation
- Live Help / chat support
- User activity tracking

Current code also shows an important maturity gap:

- `AuthService`, `RegisterService`, `UserService`, campaign and promo calls expect real backend APIs
- `CartService`, `UserActivityService`, demo auth flows, address management and parts of favorites still run in `localStorage`
- AI Shop and Live Help currently work with in-browser heuristics and local session state rather than real AI/backend orchestration

This means the backend is not starting from a stable server-side commerce platform yet. It is starting from a UI-first prototype that already reveals the right bounded contexts.

## 2. Recommendation

### Short version

Do **not** start with a fully distributed microservice system immediately.

For this project, the best fit is:

- Java-based commerce backend
- Python-based AI backend
- API gateway in front
- Event-driven integration model
- A **modular monolith first**, designed so that selected modules can later be extracted into microservices

### Why this is the right call

If we go straight to many microservices now, we will create operational complexity before the business flows are fully stabilized:

- distributed transactions
- service discovery and deployment complexity
- observability burden
- duplicated DTO and auth concerns
- harder local development
- slower iteration while requirements are still changing

Right now the frontend still has mocked/local behaviors for cart, order history, address book, AI combo memory and support chat. That is a signal that domain contracts are still evolving. In that phase, a modular monolith gives much better speed and control.

## 3. Target architecture

### 3.1 High-level structure

```text
React Web
   |
API Gateway / BFF
   |
   +-- Commerce Platform (Java / Spring Boot)
   |      +-- Identity facade / auth integration
   |      +-- Customer module
   |      +-- Catalog module
   |      +-- Search module
   |      +-- Cart module
   |      +-- Order module
   |      +-- Promotion module
   |      +-- Favorite module
   |      +-- Notification module
   |
   +-- AI Platform (Python / FastAPI)
          +-- AI Shop recommendation/orchestration
          +-- Support chat orchestration
          +-- Prompt management
          +-- Vector retrieval / semantic search
```

### 3.2 Suggested technology stack

- `Java 21`
- `Spring Boot`
- `Spring Modulith` or strong package-by-domain modularization
- `Spring Security`
- `PostgreSQL`
- `Redis`
- `Kafka` or `RabbitMQ`
- `OpenSearch` or Elasticsearch for product search
- `Keycloak` for identity and token lifecycle
- `Python + FastAPI` for AI orchestration
- `pgvector` or a vector database only if semantic retrieval becomes real need

## 4. Proposed domain boundaries

### 4.1 Java commerce platform modules

#### 1. Identity / Access

Responsibilities:

- login/logout
- registration flow
- email/phone verification
- token validation
- role management

Note:

- Keycloak can stay as the identity provider
- Java service should be the business-facing auth facade, not the place where frontend directly knows every IAM detail

#### 2. Customer Service

Responsibilities:

- customer profile
- preferences
- body profile for AI Shop
- communication permissions
- address book

Maps well to:

- `UserService`
- profile and address sections inside `MyUserInfo`
- body profile currently stored under `tb_ai_shop_body_profile_v1`

#### 3. Catalog Service

Responsibilities:

- categories
- products
- variants
- attributes
- stock snapshot
- media
- related product rules

Maps well to:

- `ProductService`
- `CategoryService`
- product listing, detail, related products, facets

#### 4. Search Service

Responsibilities:

- keyword search
- filtering/faceting
- ranking
- typo tolerance

Maps well to:

- `SearchService`
- product facets and search result flows

This should usually own the search index, while catalog remains the source of truth.

#### 5. Cart Service

Responsibilities:

- persistent carts
- anonymous cart + logged-in cart merge
- line items
- selected size/color
- summary calculation
- shipping/discount preview

Maps well to:

- `CartService`
- cart widget and checkout preparation flows

#### 6. Order Service

Responsibilities:

- checkout
- order creation
- payment orchestration
- shipment status
- cancellation/return state machine

Maps well to:

- `UserActivityService.addOrder`
- `MyOrderComp`
- checkout behavior currently simulated in `CartPage`

#### 7. Promotion Service

Responsibilities:

- campaign banners
- promo assets
- coupon evaluation
- cart promotion rules

Maps well to:

- `CampaignService`
- `PromoService`
- discount logic currently hardcoded in cart summary

#### 8. Favorite Service

Responsibilities:

- favorite list
- add/remove favorite
- favorite events for personalization

Maps well to:

- `FavoriteService`

#### 9. Notification Service

Responsibilities:

- registration confirmation messages
- order notifications
- campaign notifications
- AI recommendation notifications if needed later

### 4.2 Python AI platform

#### 10. AI Orchestration Service

Responsibilities:

- AI Shop combo generation
- support chat orchestration
- prompt templates
- LLM provider abstraction
- conversation memory
- retrieval from product/customer/help data
- tool calling to commerce services

Maps well to:

- `AIShopWidget`
- `AIShopComboPage`
- `LiveHelpWidget`

This service should not become your system of record. It should orchestrate and infer, while product, cart, order and customer truth remains in Java services.

## 5. Data ownership

Each domain should own its data. A clean ownership model could be:

- `customer_db`: customers, addresses, preferences, body profile
- `catalog_db`: products, categories, variants, attributes, inventory view
- `cart_db`: carts and cart items
- `order_db`: orders, payments, shipments, returns
- `promotion_db`: campaigns, coupon rules, banner configs
- `favorite_db`: favorites
- `search_index`: denormalized searchable catalog documents
- `ai_memory_db`: chat sessions, prompts, embeddings, recommendation traces

If we start modular monolith-first, these may begin inside one PostgreSQL cluster with separate schemas:

- `customer`
- `catalog`
- `cart`
- `order`
- `promotion`
- `favorite`
- `integration`

That gives you separation without forcing network-level distribution on day one.

## 6. API and integration style

### Synchronous APIs

Use REST for frontend-facing and transactional flows:

- login
- register
- get product list/detail
- search
- add to cart
- update favorite
- checkout
- profile update

### Asynchronous events

Use events for cross-domain reactions:

- `CustomerRegistered`
- `ProductViewed`
- `FavoriteToggled`
- `CartCheckedOut`
- `OrderCreated`
- `OrderPaid`
- `OrderShipped`
- `OrderDelivered`
- `PromotionUpdated`

These events are especially valuable for:

- personalization
- analytics
- AI recommendation context
- search indexing
- notifications

Use the outbox pattern from the start, even if modules live in one deployable app.

## 7. AI integration model

This part matters because your future direction is AI-heavy.

### AI Shop

Suggested flow:

1. Frontend sends user intent, style preferences, budget and body profile
2. AI service fetches relevant products from Catalog/Search
3. AI service ranks or composes outfit candidates
4. AI service stores recommendation trace
5. Frontend receives structured combo response

Output should be structured JSON, not only free text:

- combo id
- explanation
- recommended products
- alternates
- price summary
- confidence / reasoning metadata if useful

### Live Help / Chat

Suggested flow:

1. Chat request reaches AI service
2. AI service retrieves user context from Customer, Cart and Order services
3. AI service retrieves help center / policy knowledge
4. LLM answers
5. If action is needed, AI service calls commerce APIs through defined tools

Examples:

- "Where is my order?"
- "Can I return this item?"
- "Find me cheaper alternatives in my cart"
- "Build a black office outfit under 3000 TL"

### Important design rule

The AI service should call stable internal APIs, not read commerce databases directly.

That rule keeps the architecture maintainable when services are later extracted.

## 8. Suggested deployment topology

### Phase 1

- `gateway-service`
- `commerce-platform` as a single Java deployable
- `ai-service` as one Python deployable
- `postgres`
- `redis`
- optional `opensearch`

### Phase 2

Extract only when pain becomes real:

- `catalog-service`
- `search-service`
- `cart-service`
- `order-service`
- `customer-service`

### Phase 3

Keep these as separate only if you truly need independent scaling, team ownership or release cadence.

## 9. Security and platform concerns

Recommended baseline:

- Keycloak with OIDC/JWT
- gateway-level auth validation
- service-to-service auth for AI and internal services
- PII-aware logging policy
- rate limiting for chat and AI endpoints
- audit trail for AI-triggered actions
- prompt injection safeguards for tool-calling flows
- masking of customer/order data inside AI logs

## 10. Practical migration from the current frontend

### First backend wave

Build these first:

1. `identity/customer`
2. `catalog`
3. `search`
4. `cart`
5. `favorite`

Because the current UI already depends heavily on them.

### Second backend wave

Build next:

1. `order`
2. `promotion`
3. `notification`
4. `ai-service`

### Frontend changes you will need

- replace local cart with API-backed cart
- replace local order history with real orders
- move addresses from local storage to customer APIs
- move AI Shop combo/session persistence to backend
- move live help conversation state to AI service

## 11. Decision: should we adopt microservices now?

### My recommendation

**Not as a fully distributed architecture on day one.**

Adopt a **microservice-ready architecture**, but implement it in this order:

1. Modular Java commerce backend
2. Separate Python AI service
3. Event contracts and outbox
4. API gateway
5. Extract only the modules that prove they need separation

### Why this is the best balance

- supports future AI integration cleanly
- keeps Java as the core backend language
- keeps Python where it adds the most value
- reduces operational cost early
- avoids premature distribution
- still lets us evolve into real microservices later

## 12. Final verdict

For TrendBurada, the most suitable architecture is:

- **Java commerce core**
- **Python AI orchestration**
- **gateway in front**
- **event-driven boundaries**
- **modular monolith first, selective microservice extraction later**

If you ask me whether “we should directly deploy a full microservice backend now”, my answer is:

**No.**

If you ask whether “we should design today with microservice boundaries and future extraction in mind”, my answer is:

**Absolutely yes.**

## 13. Suggested next step

The next most useful step is to create a concrete backend blueprint with:

- service/module list
- API contracts
- database schema draft
- event list
- first sprint scope
- folder/repository structure

That would turn this proposal into an implementable roadmap.
