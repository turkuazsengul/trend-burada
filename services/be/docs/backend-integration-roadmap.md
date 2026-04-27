# Backend Entegrasyon Yol Haritası

> **Amaç:** Web uygulamasında (`trend-burada-web`) hâlâ statik veri, mock servis veya `localStorage` ile çalışan tüm akışları, backend (`trend-burada-be`) ile gerçek entegrasyona kavuşturmak.
> Bu doküman, backend tarafında yürütülecek iş kalemlerini (epic → task) çıkarmak ve her birini ayrı bir prompt olarak ilerletmek için referans olarak hazırlanmıştır.
>
> **Kapsam:** Statik veri yerleri **+** eksik akışlar (auth, cart, checkout, order, address, payment, search, review, notification, seller vb.).
> **Hazırlanma tarihi:** 2026-04-25.

---

## 0. Özet (TL;DR)

Frontend tarafında **17 sayfa / route** mevcut; bunların yalnızca bir kısmı backend'e bağlı, geri kalanı statik veri veya `localStorage` üzerinde çalışıyor. Backend tarafında ise **10 modül** ve **~32 REST endpoint** mevcut, fakat aşağıdaki domainlerde önemli boşluklar var:

- **Address Book** entity ve API'si **yok**
- **Payment Gateway** entegrasyonu **yok** (ödeme client-side OTP demosu ile yürüyor)
- **Order Detail** endpoint'i ve order state machine **yok**
- **Review & Rating** API'si **yok**
- **Notification** API'si **yok**
- **Search Autocomplete / Facet** zenginleştirmesi eksik
- **Cart**: DELETE, PATCH (qty güncelleme), guest-cart merge **yok**
- **Favorite**: DELETE endpoint **yok**, customer kimliği query param ile geliyor
- **Customer profile UPDATE** endpoint'i **yok**
- **CMS / Content** (mega menu, footer, kampanya banner, footer link grupları) için CMS yok
- **Seller modülü**: 6 sayfası mevcut, backend tarafında controller'lar henüz embriyonik
- **AI Shop** (kombin önerileri): backend'de placeholder rule-based yanıt; ürün eşleme yok

Toplamda **9 epic, ~40 task** olarak parçalanmaya uygun bir iş yığını öngörülüyor (bkz. §10).

---

## 1. Sistem Snapshot

### 1.1 Frontend (`trend-burada-web`)

| Özellik | Değer |
|---|---|
| Framework | React 17 (Create React App) |
| Router | React Router v5.2 |
| State | React Context (`AppContext`) + `localStorage` |
| HTTP | axios 0.19 |
| UI kit | PrimeReact 10.4 |
| Env | `window.__APP_CONFIG__` + `process.env.REACT_APP_*` |

### 1.2 Backend (`trend-burada-be`)

| Özellik | Değer |
|---|---|
| Runtime | Java 17 + Spring Boot 3.3.5 (modular monolith) |
| Modüller | `auth`, `customer`, `catalog`, `cart`, `order`, `promotion`, `favorite`, `ai-integration`, `shared-kernel`, `platform-app` |
| Auth | OAuth2 Resource Server (Keycloak — JWT) |
| DB | PostgreSQL — 7 schema (customer, catalog, cart, ordering, favorite, promotion, public) |
| Migration | SQL init script (Flyway/Liquibase **yok**) |
| Endpoint sayısı | ~32 |
| Entity sayısı | 8 |

---

## 2. Sayfa / Route Bazlı Entegrasyon Durumu

| Path | Component | Backend bağlı mı? | Boşluk |
|---|---|---|---|
| `/` | `CampaignItems` | Kısmi (fallback'li) | Kampanya CMS yok, statik 12 banner var |
| `/login` | `LoginPage` | Kısmi | Demo auth flag aktif, gerçek auth çağrıları opsiyonel |
| `/product/:id` | `ProductPage` | Kısmi | Ürün listesi `getStaticProductsByCategory` üretiyor |
| `/detail/:id` | `ProductDetail` | Kısmi | Detay endpoint opsiyonel, statik fallback |
| `/arama` | `SearchResultsPage` | Kısmi | Arama opsiyonel, autocomplete yok |
| `/favoriler` | `FavoritesPage` | Kısmi | DELETE yok; customerCode query param |
| `/sepetim` | `CartPage` | **Hayır** | Tamamen `localStorage`; checkout demo OTP |
| `/hesabım/KullaniciBilgilerim` | `MyUserInfo` | Kısmi | Update endpoint backend'de **yok**; AI body profile lokal |
| `/hesabım/Siparislerim` | `MyOrderComp` | **Hayır** | Order list/detail UI bağsız |
| `/hesabım/Adreslerim` | `AddressRedirect` | **Hayır** | Address book API **yok** |
| `/ai-shop/kombin/:comboId` | `AIShopComboPage` | **Hayır** | Backend yer tutucu döndürüyor |
| `/seller/login` | `SellerLoginPage` | **Hayır** | Seller auth yok |
| `/seller` | `SellerDashboardPage` | **Hayır** | Metric API yok |
| `/seller/products` | `SellerProductsPage` | **Hayır** | Listeleme yok |
| `/seller/products/new` | `SellerProductCreatePage` | **Hayır** | Create akışı bağsız |
| `/seller/products/:id/edit` | `SellerProductEditPage` | **Hayır** | Update akışı bağsız |
| `/seller/orders` | `SellerOrdersPage` | **Hayır** | Seller order API yok |

> **Not:** "Kısmi" işaretli sayfalar `USE_STATIC_*` flag'leri ile statik veriye düşüyor; bu flag'lerin tamamı kapatıldığında akışın hatasız çalışabilmesi gerekiyor.

---

## 3. Statik / Hardcoded İçerik Kataloğu

### 3.1 Catalog (en hacimli statik içerik)

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `src/data/demoProductData.js` | `MEGA_MENU_CATEGORIES` (7 kategori, 30+ alt kategori) | `GET /api/v1/catalog/categories` (tree) |
| `src/data/demoProductData.js` | `CATEGORY_META` (72+ kategori, başlık/altyazı/görsel havuzu) | CMS / catalog admin |
| `src/service/ProductService.jsx` | `BRAND_POOL`, `COLOR_POOL`, `SIZE_POOL`, `INSTALLMENT_POOL`, `IMAGE_POOL`, `TITLE_PREFIX`, `FIT_POOL`, `FABRIC_POOL`, `ORIGIN_POOL`, `DETAIL_SUFFIX_POOL` | Master data: marka, attribute katalogu |
| `src/service/ProductService.jsx` `getStaticProductsByCategory` | Kategori başına 54 ürün üretiyor | `GET /api/v1/catalog/products?categoryId=&page=&size=` |
| `src/AppTopBar.js` | `CATEGORY_LABEL_TRANSLATIONS`, `SUBCATEGORY_LABEL_TRANSLATIONS` (TR/EN sözlük) | i18n master + CMS çevirileri |
| `src/AppTopBar.js` | `staticMegaMenuPromoImages` (12 Unsplash URL) | CMS / CDN tarafı |
| `src/AppTopBar.js` | `mobileSearchPreviewProducts` (3 örnek ürün) | Trending products endpoint |

### 3.2 Cart / Checkout

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `src/service/CartService.jsx` | Kargo eşiği 350 TL = ücretsiz, aksi 39.9 TL; >2500 TL indirimi | Shipping rules + coupon engine |
| `src/components/CartPage.js` | 3 ödeme yöntemi (kart/havale/kapıda) | `GET /api/v1/payment/methods` |
| `src/components/CartPage.js` | Demo OTP `"867245"` | Gerçek OTP servisi (SMS/3DS) |
| `src/components/CartPage.js` | 1-6 taksit istemci hesabı | Banka/BIN bazlı taksit endpoint |

### 3.3 Address

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `CartPage.js` (address form) | İl/ilçe alanları freetext | İl/ilçe lookup API |

### 3.4 Order

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `src/service/UserActivityService.jsx` `addOrder()` | `localStorage.tb_orders_${userId}` listesine ekliyor | `POST /api/v1/order` (gerçek sipariş yaratma) |

### 3.5 Footer / CMS

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `src/AppFooter.js` | 4 link grubu (TrendBurada, Hakkımızda, Kampanya, Yardım) — 12+ link | Footer CMS endpoint |
| `src/components/home-page-components/CampaignItems.js` | `staticCampaignData` 12 banner | `GET /api/v1/promotion/campaigns` (mevcut promotion-controller bunu zenginleştirebilir) |

### 3.6 Profile / AI Shop

| Dosya | Statik içerik | Backend ihtiyacı |
|---|---|---|
| `src/components/customer-profile-components/MyUserInfo.js` | `BODY_PROFILE_DEFAULTS` | Kullanıcı profili genişletilmiş alanlar (height, weight, fit, vs.) |
| `src/modules/seller/data/sellerCatalogConfig.js` | Seller config | Seller config endpoint |

### 3.7 Demo / Fixture (silmek üzere)

| Dosya | Açıklama |
|---|---|
| `src/public/assets/demo/data/*.json` | 10 JSON: customers, products, events, icons, vs. — yalnızca dev fixture |
| `DemoAuthService.jsx` | `localStorage.demoAuthUsers` (USE_DEMO_LOCAL_AUTH ile) |

> **Aksiyon notu:** Üretim için `USE_STATIC_*` ve `USE_DEMO_LOCAL_AUTH` flag'leri kapatıldığında uygulama hatasız çalışacak şekilde ilgili API'lerin doldurulması gerekir.

---

## 4. localStorage / İstemci-içi Sahte Veri Haritası

| Anahtar | Tutulan veri | Hedef backend kaynağı |
|---|---|---|
| `token` | JWT | (auth servisi — mevcut) |
| `user` | Kullanıcı objesi | `/api/v1/customer` (mevcut, GET) |
| `tb_cart_items_v1` | Sepet kalemleri | `/api/v1/cart/*` (mevcut, **eksik kısımlar var**) |
| `favoriteProducts:{userId}` | Favori ürünler | `/api/v1/favorite/*` (mevcut, DELETE eksik) |
| `tb_viewed_products_{userId}` | Son görüntülenen ürünler (max 60) | `/api/v1/customer/viewed-products` (yeni) |
| `tb_orders_{userId}` | Mock siparişler | `/api/v1/order` (mevcut create + listeleme) |
| `tb_ai_shop_body_profile_v1` | Beden ölçüleri | `/api/v1/customer/body-profile` (yeni) |
| `tb_addresses_{userId}` | Adres defteri | `/api/v1/customer/addresses` (yeni — entity yok) |
| `demoAuthUsers` | Demo kullanıcılar | (kaldırılacak) |
| `tb_lang` | TR/EN tercihi | Kullanıcı tercihleri endpoint (yeni) |

---

## 5. Mevcut API Entegrasyonları (Frontend → Backend)

| Frontend servisi | Endpoint | Backend tarafı |
|---|---|---|
| `AuthService.jsx` | `LOGIN_URL`, `LOGOUT_URL`, `ACCOUNT_STATUS_URL` | `auth-controller` üzerinde mevcut |
| `RegisterService.jsx` | `REGISTER_URL`, `REGISTER_CONFIRM_URL`, `REGISTER_CREATE_CONFIRM_URL` | Mevcut |
| `UserService.jsx` | `USER_INFO_URL`, `USER_UPDATE_URL` | GET mevcut, **UPDATE eksik** |
| `ProductService.jsx` | `PRODUCT_LIST_URL`, `PRODUCT_DETAIL_URL`, `PRODUCT_FACETS_URL` | Liste & detay mevcut, **facet endpoint eksik** |
| `FavoriteService.jsx` | `FAVORITE_LIST_URL`, `FAVORITE_TOGGLE_URL` | Add mevcut, **DELETE eksik**, customerCode query param (kötü pratik) |
| `SearchService.jsx` | `SEARCH_URL` | Var (SQL like benzeri), autocomplete & facet **yok** |
| `CampaignService.jsx` | `CAMPAIGN_ITEMS_URL` | Var (promotion-controller) |
| `PromoService.jsx` | `PROMO_IMAGES_URL` | Var (promotion-controller) |
| `CategoryService.jsx` | hardcoded `localhost:20000/api/v1/product/category/getAll` | **Sayfada kullanılmıyor**, hardcoded URL temizlenmeli |

---

## 6. Backend Tarafında Mevcut REST Yüzeyi (Özet)

| Domain | Mevcut endpoint'ler | Auth |
|---|---|---|
| Auth | login, logout, register, register-confirm, resend-code, account-status (~11) | Public/Basic→JWT |
| Catalog | product list/detail, product CRUD (SELLER), category get-all | Public (read), SELLER/ADMIN (write) |
| Cart | preview, items GET, items POST | JWT |
| Order | list, create | JWT |
| Customer | profile GET (email query param) | JWT |
| Favorite | list (customerCode query), add | Public (yanlış — düzeltilmeli) |
| Promotion | banner/promo list | Public |
| AI | rule-based recommendation placeholder | Public |
| Seller | login (yer tutucu) | Public |
| Architecture | actuator, swagger | Public |

> **Detay için:** `docs/architecture-overview.md` ve `docs/auth-module-overview.md` dosyalarına bakınız.

---

## 7. Domain Bazlı Kıyas Matrisi (Frontend ihtiyacı ↔ Backend durumu ↔ Boşluk)

> Lejant: ✅ Var · ⚠️ Eksik/Uyumsuz · ❌ Yok

### 7.1 Auth & Account

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Login | ✅ | ✅ | — |
| Register + email confirm | ✅ | ✅ | — |
| Resend confirmation | ✅ | ✅ | — |
| Password reset | ❌ (UI yok) | ❌ | UI + endpoint yarat |
| Email change with verification | ❌ | ❌ | UI + endpoint yarat |
| Social login (Google/Apple) | ❌ | ❌ | (faz-2) |
| 2FA | ❌ | ❌ | (faz-2) |
| Account status lookup (email) | ✅ | ✅ | — |
| JWT refresh token | ⚠️ (var ama 401 handler eksik) | ⚠️ | Refresh endpoint + frontend interceptor |
| Logout | ✅ | ✅ | — |

### 7.2 Customer Profile

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Profile GET | ✅ | ⚠️ (email query param — JWT'den çözülmeli) | Endpoint'i `/me`'ye refactor et |
| Profile UPDATE | ✅ | ❌ | `PATCH /api/v1/customer/me` ekle |
| Change password | ⚠️ (UI form var) | ❌ | Endpoint ekle |
| Body profile (AI Shop) | ✅ (localStorage) | ❌ | Sub-resource ekle: `/customer/me/body-profile` |
| Language preference | ✅ (localStorage) | ❌ | Sub-resource: `/customer/me/preferences` |

### 7.3 Catalog & Search

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Category tree (mega menu) | ✅ | ⚠️ (`getAll` flat) | Tree endpoint + i18n label desteği |
| Product list (kategori bazlı, sayfalı, filtreli) | ✅ | ✅ (var) | Filtre/sıralama parametreleri tamamlanmalı |
| Product detail | ✅ | ✅ | Beden/renk varyantları kontrol edilmeli |
| Facets (filter options) | ✅ | ❌ | `GET /catalog/facets?categoryId=` ekle |
| Search (full-text) | ✅ | ⚠️ (basit) | Lucene/PG full-text + relevance |
| Search autocomplete | ❌ (UI yok ama gerekli) | ❌ | `GET /search/autocomplete?q=` ekle |
| Trending / featured products | ✅ (statik) | ❌ | `GET /catalog/featured` |
| Brand list | ✅ (BRAND_POOL) | ❌ | Brand entity + endpoint |
| Color/Size catalog | ✅ (POOL) | ⚠️ (ürün JSON'unda) | Master data tablosu + endpoint |

### 7.4 Cart

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Cart preview | ✅ | ✅ | — |
| List items | ✅ | ✅ | — |
| Add item | ✅ | ✅ | — |
| Update qty | ✅ | ❌ | `PATCH /cart/items/{id}` |
| Remove item | ✅ | ❌ | `DELETE /cart/items/{id}` |
| Clear cart | ✅ | ❌ | `DELETE /cart` |
| Apply coupon | ✅ (UI var, mock) | ❌ | `POST /cart/coupon` |
| Guest cart merge on login | ⚠️ | ❌ | `POST /cart/merge` |
| Shipping cost calculation | ✅ (statik kural) | ❌ | `GET /shipping/quote` |

### 7.5 Address Book

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| List addresses | ✅ (localStorage) | ❌ | **Entity + tablo + CRUD endpoint'leri** |
| Create address | ✅ | ❌ | `POST /customer/me/addresses` |
| Update address | ✅ | ❌ | `PUT /customer/me/addresses/{id}` |
| Delete address | ✅ | ❌ | `DELETE /customer/me/addresses/{id}` |
| Set default | ✅ | ❌ | `POST /customer/me/addresses/{id}/default` |
| İl/İlçe/Mahalle lookup | ❌ (freetext) | ❌ | `GET /geo/cities`, `GET /geo/districts?cityId=` |

### 7.6 Order & Checkout

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Order list | ✅ (UI boş) | ✅ (var) | Sayfalama + filtre param'leri |
| Order detail | ✅ | ❌ | `GET /order/{id}` |
| Place order (checkout) | ✅ (mock) | ✅ (create var) | Address + payment ile uçtan uca test |
| Order status timeline | ✅ | ❌ | Status enum + transition + history |
| Cancel order | ✅ | ❌ | `POST /order/{id}/cancel` |
| Return / RMA | ❌ (UI yok) | ❌ | Yeni domain |
| Track shipment | ❌ | ❌ | Kargo entegrasyonu (faz-2) |

### 7.7 Payment

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Payment methods list | ✅ (statik 3) | ❌ | `GET /payment/methods` |
| Installment options (BIN bazlı) | ✅ (statik 1-6) | ❌ | `POST /payment/installments` |
| Init payment / 3DS redirect | ✅ (mock OTP) | ❌ | `POST /payment/init` (Iyzico/Param/Param POS — karar gerekli) |
| Payment callback (3DS) | ❌ | ❌ | `POST /payment/callback` |
| Refund | ❌ | ❌ | `POST /payment/{id}/refund` (faz-2) |

### 7.8 Favorite / Wishlist

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| List | ✅ | ⚠️ (customerCode query) | JWT'den customer çöz |
| Toggle add | ✅ | ✅ | — |
| Delete | ✅ | ❌ | `DELETE /favorite/{productId}` |

### 7.9 Reviews & Ratings

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| List reviews of product | ⚠️ (UI yok) | ❌ | Tüm domain yok |
| Write review | ⚠️ | ❌ | — |
| Rating aggregate (yıldız) | ✅ (statik 4-5) | ❌ | Product detail'a inject |
| Helpful vote | ❌ | ❌ | (faz-2) |

### 7.10 Notifications

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| In-app inbox | ❌ (UI yok) | ❌ | Domain + endpoint |
| Email/SMS preferences | ❌ | ❌ | Sub-resource |
| Order status push | ❌ | ❌ | Event-driven (faz-2) |

### 7.11 CMS / Content

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Mega menu (kategori + promo görsel) | ✅ (statik) | ❌ | CMS endpoint (kategori treesi + promo asset eşlemesi) |
| Footer link grupları | ✅ (statik) | ❌ | `GET /content/footer` |
| Kampanya bannerları | ✅ (kısmi) | ✅ (promotion) | Görsel/sıralama yönetimi zenginleştirilmeli |
| FAQ | ❌ | ❌ | (faz-2) |

### 7.12 Seller Portal

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Seller login | ✅ (UI) | ⚠️ (yer tutucu) | Real login (Keycloak SELLER role) |
| Seller dashboard metrics | ✅ | ❌ | `GET /seller/dashboard` |
| Seller product CRUD | ✅ | ⚠️ (catalog'da CRUD var ama seller-scoped değil) | Seller-scoped product CRUD + sahiplik kontrolü |
| Seller order list | ✅ | ❌ | `GET /seller/orders` (seller filtresi) |
| Seller order detail | ✅ | ❌ | `GET /seller/orders/{id}` |
| Stok yönetimi | ❌ | ❌ | (faz-2) |

### 7.13 AI Shop

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Combo recommendation (body profile → ürünler) | ✅ | ⚠️ (rule-based placeholder) | Gerçek matching algoritması veya Python servisi |
| Combo detail | ✅ | ❌ | `GET /ai-shop/combos/{id}` |

### 7.14 User Activity

| Yetenek | Frontend ihtiyacı | Backend durumu | Boşluk |
|---|---|---|---|
| Recently viewed | ✅ (localStorage) | ❌ | `GET/POST /customer/me/viewed-products` |
| Search history | ⚠️ | ❌ | (faz-2) |

---

## 8. Gateway / Config Server / Diğer Cross-cutting

- **Gateway:** Yeni eklenen `/customer/me/**`, `/payment/**`, `/review/**`, `/notification/**`, `/seller/**`, `/geo/**`, `/content/**` route'larının auth filter ile korunması gerekiyor.
- **Config Server:** Payment provider credential'ları (Iyzico vs.), SMS provider, mail provider için ayrı profil gerekecek.
- **CORS:** Frontend baseURL'i (env'den) için CORS izinleri kontrol edilmeli.
- **Migration aracı:** Şu an SQL init script var. Yeni domainler eklenirken **Flyway**'a geçilmesi şiddetle önerilir (her epic için ayrı `V*__*.sql`).
- **OpenAPI:** Tüm yeni endpoint'ler swagger spec'ine yansımalı; frontend tarafında axios client codegen düşünülebilir.
- **Observability:** Yeni endpoint'lerde structured logging + Micrometer metric (özellikle payment, order).

---

## 9. Açık Kararlar (User'a sorulacak / netleşmesi gereken)

1. **Payment provider:** Iyzico mu, Param POS mu, başka? 3DS redirect URL şeması nasıl olacak?
2. **SMS provider:** Netgsm / Twilio / iletimerkezi? OTP süresi & retry politikası?
3. **Mail provider:** SES / SendGrid / kurumsal SMTP?
4. **Search engine:** PostgreSQL `tsvector` ile mi devam, yoksa Elasticsearch / Meilisearch / Typesense?
5. **CMS:** İçeriğe yönetim paneli yazılacak mı, yoksa harici CMS (Strapi, Contentful) mi?
6. **Cargo / kargo entegrasyonu:** Yurtiçi/Aras/MNG webhook desteği faza alınsın mı?
7. **Multi-vendor mu, internal seller mı?** Seller modülü kapsamı (komisyon, ödeme dağıtımı) belirsiz.
8. **i18n:** Sadece TR/EN mi, daha fazla dil mi? Çeviri yönetimi backend'de mi yapılacak?
9. **JWT refresh stratejisi:** Sliding session mı, refresh token endpoint mi?
10. **Stok yönetimi:** Gerçek zamanlı azalma + over-sell koruması bu fazda mı?

---

## 10. Önerilen Backend Yol Haritası (Epic → Task)

> Her bir task, ayrı bir backend prompt'una dönüştürülebilir. Sıralama; bağımlılık ve risk göz önüne alınarak önerilmiştir.

### EPIC 1 — Cart Tamamlama (P0)
*Frontend `localStorage` cart'ından gerçek backend cart'ına geçişin temel taşı.*

- **T1.1** `PATCH /api/v1/cart/items/{id}` — kalem miktarı güncelle
- **T1.2** `DELETE /api/v1/cart/items/{id}` — kalem sil
- **T1.3** `DELETE /api/v1/cart` — sepeti boşalt
- **T1.4** `POST /api/v1/cart/merge` — guest cart → user cart birleştirme
- **T1.5** Frontend ile sözleşme uyumu testi (renk/beden/qty alan adları)

### EPIC 2 — Address Book (P0)
*Address Book entity'si yok, sıfırdan inşa edilecek.*

- **T2.1** `Address` entity + `customer.address` tablosu + Flyway migration
- **T2.2** `GET /api/v1/customer/me/addresses` — listeleme
- **T2.3** `POST /api/v1/customer/me/addresses` — oluşturma
- **T2.4** `PUT /api/v1/customer/me/addresses/{id}` — güncelleme
- **T2.5** `DELETE /api/v1/customer/me/addresses/{id}` — silme
- **T2.6** `POST /api/v1/customer/me/addresses/{id}/default` — varsayılan
- **T2.7** Geo lookup: `GET /api/v1/geo/cities`, `GET /api/v1/geo/districts?cityId=` + seed data

### EPIC 3 — Customer Profile Tamamlama (P0)
- **T3.1** `customer-controller`'ı `/me` semantik'e refactor et (JWT'den customerCode çöz, query param kaldır)
- **T3.2** `PATCH /api/v1/customer/me` — profil güncelle
- **T3.3** `POST /api/v1/customer/me/password` — şifre değiştir
- **T3.4** `GET/PUT /api/v1/customer/me/body-profile` — AI shop ölçüleri
- **T3.5** `GET/PUT /api/v1/customer/me/preferences` — dil, bildirim tercihleri

### EPIC 4 — Order Detayı & State Machine (P0)
- **T4.1** `GET /api/v1/order/{id}` — sipariş detayı (kalemler + adres + ödeme + durum geçmişi)
- **T4.2** Order status enum + state machine (CREATED → PAID → PACKED → SHIPPED → DELIVERED, RETURN_REQUESTED, CANCELLED)
- **T4.3** `POST /api/v1/order/{id}/cancel` — iptal akışı (durum kontrolü)
- **T4.4** Order list filtreleri (status, tarih aralığı, sayfalama)
- **T4.5** Sipariş oluşturmada zorunlu adresId + ödeme referansı entegrasyonu

### EPIC 5 — Payment (P0)
- **T5.1** Payment provider seçim kararı + adapter interface'i
- **T5.2** `GET /api/v1/payment/methods` — aktif yöntemler
- **T5.3** `POST /api/v1/payment/installments` — BIN bazlı taksit seçenekleri
- **T5.4** `POST /api/v1/payment/init` — sipariş için ödeme başlat (3DS redirect URL)
- **T5.5** `POST /api/v1/payment/callback` — provider webhook + sipariş PAID transition
- **T5.6** Idempotency + audit log

### EPIC 6 — Catalog & Search Zenginleştirme (P1)
- **T6.1** `Brand` entity + master data + endpoint
- **T6.2** Color/Size/Attribute master data tabloları + endpoint
- **T6.3** Category tree endpoint + i18n label desteği
- **T6.4** `GET /api/v1/catalog/facets?categoryId=` — filtre seçenekleri
- **T6.5** Trending / featured endpoint
- **T6.6** Search relevance iyileştirme (PG `tsvector` veya engine kararı)
- **T6.7** `GET /api/v1/search/autocomplete?q=` — anlık öneri

### EPIC 7 — Favorite Düzeltme (P1)
- **T7.1** Favorite endpoint'lerinin JWT-secured hale getirilmesi (customerCode query param kaldır)
- **T7.2** `DELETE /api/v1/favorite/{productId}`
- **T7.3** Frontend sözleşme testi

### EPIC 8 — Review & Rating (P1)
- **T8.1** `Review` entity + tablo + Flyway migration
- **T8.2** `GET /api/v1/catalog/products/{id}/reviews` — listeleme
- **T8.3** `POST /api/v1/catalog/products/{id}/reviews` — yorum ekle (sipariş validasyonu)
- **T8.4** Product detail response'ına rating aggregate inject
- **T8.5** Moderasyon flag + admin endpoint (faz-2 kapısı)

### EPIC 9 — CMS / Content (P2)
- **T9.1** `Footer` content endpoint (link gruplarını CMS'ten serve)
- **T9.2** Mega menu promo asset endpoint
- **T9.3** Kampanya banner zenginleştirme (sıralama, geçerlilik tarihi, hedef URL)
- **T9.4** İleri faz: yönetim paneli (admin module)

### EPIC 10 — User Activity & Notifications (P2)
- **T10.1** `Recently viewed` endpoint (`/customer/me/viewed-products`)
- **T10.2** Notification entity + listeleme + okundu işareti
- **T10.3** Email/SMS preferences sub-resource
- **T10.4** Sipariş status değişiminde event publish (notification fan-out, faz-2)

### EPIC 11 — Seller Portal (P2)
- **T11.1** Keycloak'ta `SELLER` rol akışı + invite/onboard endpoint
- **T11.2** Seller-scoped product CRUD (sahiplik kontrolü `@PreAuthorize`)
- **T11.3** `GET /api/v1/seller/orders` — seller'a ait siparişler
- **T11.4** `GET /api/v1/seller/dashboard` — metric özet
- **T11.5** Stok yönetimi (faz-3)

### EPIC 12 — Cross-cutting (sürekli)
- **T12.1** Flyway entegrasyonu (init script → versionlu migration)
- **T12.2** OpenAPI sözleşmesi tamamlama + frontend client codegen değerlendirmesi
- **T12.3** JWT refresh token endpoint + frontend interceptor sözleşmesi
- **T12.4** Gateway routing & CORS güncellemeleri
- **T12.5** Observability: payment/order metrikleri, structured logging
- **T12.6** Test piramidi: integration test (Testcontainers + PostgreSQL) zorunlu hale getir

---

## 11. Öncelik Önerisi & Bağımlılıklar

```
P0 (Frontend'in temel akışlarının yaşaması için zorunlu):
  EPIC 1 (Cart) ──┐
  EPIC 2 (Address) ─┤──> EPIC 4 (Order detail/cancel) ──> EPIC 5 (Payment)
  EPIC 3 (Profile) ─┘

P1 (UX ve dönüşüm için kritik):
  EPIC 6 (Catalog/Search), EPIC 7 (Favorite fix), EPIC 8 (Review)

P2 (operasyon ve büyüme):
  EPIC 9 (CMS), EPIC 10 (Notifications), EPIC 11 (Seller)

Sürekli:
  EPIC 12 (Cross-cutting)
```

**Önerilen sıra:**
1. **Sprint 1:** Cross-cutting T12.1 (Flyway) → Address (E2) → Customer Profile (E3)
2. **Sprint 2:** Cart tamamlama (E1) → Order detay & state (E4 → T4.1-4.4)
3. **Sprint 3:** Payment (E5) — provider kararıyla birlikte → Order tamamlama
4. **Sprint 4:** Catalog/Search zenginleştirme (E6) + Favorite fix (E7)
5. **Sprint 5:** Review (E8) + CMS (E9 başlangıç)
6. **Sprint 6:** Notifications (E10) + Seller (E11)

---

## 12. Frontend Tarafında Yapılacak Yansıma İşleri (sadece referans)

> Bu doküman backend yol haritasıdır; ancak her epic'in karşılığında frontend tarafında da iş kalemi olacak. Liste:

- `USE_STATIC_*` ve `USE_DEMO_LOCAL_AUTH` flag'lerini kapatma; tüm fallback'ları temizleme.
- `localStorage` tabanlı sepet, adres, order, body-profile, viewed-products akışlarını yeni endpoint'lere taşıma.
- `CartPage.js` içindeki demo OTP ve hardcoded ödeme yöntemlerini kaldırma.
- `MEGA_MENU_CATEGORIES`, `CATEGORY_META`, `BRAND_POOL`, `*_POOL`, `staticCampaignData`, footer link grupları gibi statik veri objelerinin tamamını silme.
- Axios interceptor — 401 refresh akışı.
- Hardcoded `localhost:20000` URL'inin temizlenmesi (`CategoryService.jsx`).
- i18n: hardcoded TR/EN sözlükleri merkezi i18n çözümüne (i18next vb.) taşıma.

---

## 13. Bu Dokümandan Prompt Üretim Şablonu

Her task için backend repository'sinde aşağıdaki yapıda prompt oluşturulması önerilir:

```
Task: <T-x.y kısa başlık>
Context: <ilgili epic özeti + frontend ihtiyacı + bu dokümanın §x bölümüne referans>
Inputs:
  - Endpoint: <method + path>
  - Request DTO: <alanlar>
  - Response DTO: <alanlar>
  - Auth: <gereken rol / public>
Acceptance Criteria:
  - [ ] Migration eklendi (Flyway)
  - [ ] Entity + repository + service + controller hazır
  - [ ] Integration test (Testcontainers PG) eklendi
  - [ ] OpenAPI spec güncel
  - [ ] Gateway routing & güvenlik filter güncel
  - [ ] Frontend sözleşmesi (alan adları) doğrulandı
Impact Analysis:
  - Backend: <etkilenecek modül/sınıflar>
  - Frontend: <hangi servis dosyası güncellenecek>
  - Gateway: <route ekle/güncelle>
  - Config Server: <yeni env var? secret?>
  - DB / Migration: <yeni tablo / kolon>
Risks: <varsa>
```

---

## 14. Versiyonlama

- **v0.1 (2026-04-25):** İlk yayın — frontend tarama + backend envanteri + 12 epic / ~40 task önerisi.

