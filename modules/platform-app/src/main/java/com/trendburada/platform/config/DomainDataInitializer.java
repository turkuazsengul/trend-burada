package com.trendburada.platform.config;

import com.trendburada.cart.domain.CartEntity;
import com.trendburada.cart.domain.CartItemEntity;
import com.trendburada.cart.domain.CartItemRepository;
import com.trendburada.cart.domain.CartRepository;
import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import com.trendburada.favorite.domain.FavoriteEntity;
import com.trendburada.favorite.domain.FavoriteRepository;
import com.trendburada.order.domain.OrderEntity;
import com.trendburada.order.domain.OrderRepository;
import com.trendburada.promotion.domain.PromotionBannerEntity;
import com.trendburada.promotion.domain.PromotionBannerRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainDataInitializer {

    private static final List<String> BRANDS = List.of("Zara", "Mango", "Koton", "Ipekyol", "Mavi", "Stradivarius", "H&M", "LCW Vision", "Massimo");
    private static final List<String> COLORS = List.of("Siyah", "Beyaz", "Bej", "Lacivert", "Haki", "Kirmizi", "Gri", "Mavi", "Krem", "Pembe");
    private static final List<String> SIZES = List.of("XS", "S", "M", "L", "XL");
    private static final List<String> INSTALLMENTS = List.of("Pesin fiyatina", "2 taksit", "3 taksit", "4 taksit", "6 taksit");
    private static final List<String> TITLE_PREFIX = List.of("Premium", "Modern", "Minimal", "Zamansiz", "Sik", "Gunluk", "Klasik", "Rahat", "Trend", "Yumusak Dokulu");
    private static final List<String> FIT_POOL = List.of("Regular Fit", "Slim Fit", "Oversize", "Relaxed Fit");
    private static final List<String> FABRIC_POOL = List.of("Pamuk", "Pamuk - Elastan", "Viskon", "Keten Karisimli", "Modal");
    private static final List<String> ORIGIN_POOL = List.of("Turkiye", "Italya", "Portekiz", "Ispanya");
    private static final List<String> DETAIL_SUFFIX_POOL = List.of(
            "Gunluk Kullanim Icin Uygun",
            "Yumusak Dokulu Tasarim",
            "Modern ve Rahat Kesim",
            "Sehir Stiline Uyumlu",
            "Premium Gorunumlu Durus"
    );
    private static final Map<String, CategorySeed> CATEGORY_SEEDS = Map.ofEntries(
            Map.entry("elbise", new CategorySeed("Elbise", List.of("Midi", "Maxi", "Saten", "Kruvaze", "Drapeli", "Askili"), List.of(
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("tisort", new CategorySeed("Tisort", List.of("Basic", "Oversize", "Crop", "Ribana", "Baskili", "Modal"), List.of(
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("gomlek", new CategorySeed("Gomlek", List.of("Poplin", "Oxford", "Saten", "Keten", "Cizgili", "Oversize"), List.of(
                    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("pantolon", new CategorySeed("Pantolon", List.of("Straight", "Mom Fit", "Palazzo", "Kargo", "Yuksek Bel", "Kumas"), List.of(
                    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("ceket", new CategorySeed("Ceket", List.of("Blazer", "Bomber", "Denim", "Trenckot", "Biker", "Kapitone"), List.of(
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("triko", new CategorySeed("Triko", List.of("Balikci Yaka", "Hirka", "Ince", "Fitilli", "V Yaka", "Yun Karisimli"), List.of(
                    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("erkek-tisort", new CategorySeed("Tisort", List.of("Basic", "Polo", "Oversize", "Slim Fit", "Baskili", "Cizgili"), List.of(
                    "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("erkek-gomlek", new CategorySeed("Gomlek", List.of("Oxford", "Poplin", "Oduncu", "Slim Fit", "Keten", "Cizgili"), List.of(
                    "https://images.unsplash.com/photo-1593032465171-8bd6d6f9f9f0?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1603251579431-8041402bdeda?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("jean", new CategorySeed("Jean", List.of("Slim Fit", "Regular Fit", "Relaxed", "Straight", "Taslanmis", "Koyu Renk"), List.of(
                    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("erkek-pantolon", new CategorySeed("Pantolon", List.of("Kumas", "Chino", "Jogger", "Kargo", "Slim", "Regular"), List.of(
                    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("sweatshirt", new CategorySeed("Sweatshirt", List.of("Kapusonlu", "Basic", "Oversize", "Fermuarli", "Baskili", "Minimal"), List.of(
                    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1618354691341-e851c56960d1?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("mont", new CategorySeed("Mont", List.of("Sisme", "Puffer", "Parka", "Bomber", "Kapitone", "Su Gecirmez"), List.of(
                    "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("kiz-cocuk", new CategorySeed("Kiz Cocuk", List.of("Elbise", "Tisort", "Tayt", "Etek", "Hirka", "Pijama"), List.of(
                    "https://images.unsplash.com/photo-1519340333755-c0dff8f7c6e2?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1604917018619-6dbdd6f0388a?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("erkek-cocuk", new CategorySeed("Erkek Cocuk", List.of("Tisort", "Esofman", "Sort", "Gomlek", "Sweatshirt", "Takim"), List.of(
                    "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1596159892044-39dcf4b4f8c8?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("bebek-giyim", new CategorySeed("Bebek", List.of("Body", "Tulum", "Zibin", "Takim", "Pijama", "Hirka"), List.of(
                    "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("okul-kombinleri", new CategorySeed("Okul Kombini", List.of("Takim", "Sweatshirt", "Jean", "Gomlek", "Tayt", "Etek"), List.of(
                    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("sneaker", new CategorySeed("Sneaker", List.of("Kosu", "Gunluk", "Chunky", "Retro", "Deri", "Fileli"), List.of(
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("bot", new CategorySeed("Bot", List.of("Chelsea", "Postal", "Suet", "Deri", "Bagcikli", "Kisa"), List.of(
                    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("topuklu-ayakkabi", new CategorySeed("Topuklu", List.of("Stiletto", "Kalin Topuk", "Bilekten Bagli", "Saten", "Rugan", "Kisa Topuk"), List.of(
                    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("loafer", new CategorySeed("Loafer", List.of("Deri", "Tokali", "Suet", "Klasik", "Kalin Taban", "Minimal"), List.of(
                    "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("sandalet", new CategorySeed("Sandalet", List.of("Duz Taban", "Topuklu", "Parmak Arasi", "Bantli", "Hasir", "Platform"), List.of(
                    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("canta", new CategorySeed("Canta", List.of("Omuz", "Capraz", "Tote", "Mini", "Sirt", "Portfoy"), List.of(
                    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("kemer", new CategorySeed("Kemer", List.of("Deri", "Tokali", "Orgu", "Minimal", "Kalin", "Ince"), List.of(
                    "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1617038220299-2cf0f4e4b4a5?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("cuzdan", new CategorySeed("Cuzdan", List.of("Kartlik", "Mini", "Deri", "Zincirli", "Baskili", "Klasik"), List.of(
                    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("taki", new CategorySeed("Taki", List.of("Kolye", "Bileklik", "Kupe", "Yuzuk", "Set", "Charm"), List.of(
                    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("sapka", new CategorySeed("Sapka", List.of("Bucket", "Baseball", "Hasir", "Bere", "Vizor", "Fedora"), List.of(
                    "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("esofman", new CategorySeed("Esofman", List.of("Takim", "Alt", "Ust", "Dar Paca", "Bol Kesim", "Nefes Alan"), List.of(
                    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("tayt", new CategorySeed("Tayt", List.of("Yuksek Bel", "Dikissiz", "Performans", "Kosu", "Yoga", "Toparlayici"), List.of(
                    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("spor-sutyeni", new CategorySeed("Spor Sutyeni", List.of("Orta Destek", "Yuksek Destek", "Dikissiz", "Capraz Aski", "Nefes Alan", "Soft"), List.of(
                    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1506629905607-d9f0d6d8ef26?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("hoodie", new CategorySeed("Hoodie", List.of("Kapusonlu", "Fermuarli", "Oversize", "Basic", "Polar", "Nakisli"), List.of(
                    "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=90"
            ))),
            Map.entry("kosu-urunleri", new CategorySeed("Kosu Urunu", List.of("Kosu Tisortu", "Kosu Sortu", "Ruzgarlik", "Performans Tayt", "Nefes Alan", "Reflektorlu"), List.of(
                    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1800&q=90",
                    "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1800&q=90"
            )))
    );

    @Bean
    CommandLineRunner seedDomainData(CustomerRepository customerRepository,
                                     ProductRepository productRepository,
                                     PromotionBannerRepository promotionBannerRepository,
                                     FavoriteRepository favoriteRepository,
                                     OrderRepository orderRepository,
                                     CartRepository cartRepository,
                                     CartItemRepository cartItemRepository) {
        return args -> {
            if (customerRepository.count() == 0) {
                CustomerEntity customer = new CustomerEntity();
                customer.setCustomerCode("cust-1001");
                customer.setFullName("Demo Kullanici");
                customer.setEmail("demo@trendburada.com");
                customer.setSegment("LOYAL");
                customer.setPreferredCategory("kadin");
                customerRepository.save(customer);
            }

            for (ProductEntity product : seedProducts()) {
                upsertProduct(productRepository, product);
            }

            for (PromotionBannerEntity banner : seedBanners()) {
                upsertBanner(promotionBannerRepository, banner);
            }

            if (favoriteRepository.count() == 0) {
                FavoriteEntity favorite = new FavoriteEntity();
                favorite.setCustomerCode("cust-1001");
                favorite.setProductCode("elbise-1");
                favorite.setCreatedAt(OffsetDateTime.now().minusDays(1));
                favoriteRepository.save(favorite);
            }

            if (orderRepository.count() == 0) {
                OrderEntity order = new OrderEntity();
                order.setOrderCode("ord-20260422-1");
                order.setCustomerCode("cust-1001");
                order.setStatus("SHIPPED");
                order.setTotalAmount(2750.50);
                order.setCreatedAt(OffsetDateTime.now().minusDays(1));
                orderRepository.save(order);
            }

            if (cartRepository.count() == 0) {
                CartEntity cart = new CartEntity();
                cart.setCartCode("cart-1001");
                cart.setCustomerCode("cust-1001");
                cartRepository.save(cart);

                cartItemRepository.save(buildCartItem("cart-1001", "elbise-1", 1, 1899.90));
                cartItemRepository.save(buildCartItem("cart-1001", "sneaker-1", 1, 2499.90));
            }
        };
    }

    private List<ProductEntity> seedProducts() {
        List<ProductEntity> products = new ArrayList<>();
        for (Map.Entry<String, CategorySeed> entry : CATEGORY_SEEDS.entrySet()) {
            products.addAll(buildCategoryProducts(entry.getKey(), entry.getValue()));
        }
        return products;
    }

    private List<PromotionBannerEntity> seedBanners() {
        return List.of(
                buildBanner("cmp-1", "Sehirde Yeni Sezon Stili", "Sehir ritmine uyum saglayan yeni sezon kombinlerini kesfet.", "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=82", "/product/elbise", "HERO", 1),
                buildBanner("cmp-2", "Premium Sokak Koleksiyonu", "Sokak stiline premium bir dokunus kat.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=82", "/product/ceket", "HERO", 2),
                buildBanner("cmp-3", "Modern Kadin Seckisi", "Gunluk ve ofis stiline uygun kadin secimi.", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=82", "/product/gomlek", "HERO", 3),
                buildBanner("cmp-4", "Minimal ve Sik Kombinler", "Minimal cizgide one cikan kombin onerileri.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=82", "/product/triko", "SHOWCASE", 4),
                buildBanner("cmp-5", "Gunluk Rahatlik, Premium Durus", "Konforu ve premium gorunumu bir araya getir.", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=82", "/product/tisort", "SHOWCASE", 5),
                buildBanner("cmp-6", "Sezonun En Yeni Parcalari", "Bu haftanin favori urunlerini vitrinde topladik.", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=82", "/product/pantolon", "SHOWCASE", 6),
                buildBanner("cmp-7", "Kadin Ceket ve Dis Giyim", "Dis giyimde sezonun dikkat ceken parcalari.", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=2200&q=86", "/product/ceket", "CAMPAIGN", 7),
                buildBanner("cmp-8", "Erkek Gunluk Koleksiyon", "Erkek gunluk stilinde yeni secimler seni bekliyor.", "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=2200&q=86", "/product/erkek-tisort", "CAMPAIGN", 8),
                buildBanner("cmp-9", "Cocuk Moda Dunyasi", "Renkli ve rahat cocuk modasi bir arada.", "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=2200&q=86", "/product/kiz-cocuk", "CAMPAIGN", 9),
                buildBanner("cmp-10", "Ayakkabi Trendleri", "Sneaker ve ayakkabi kategorisinde one cikanlar.", "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=2200&q=86", "/product/sneaker", "CAMPAIGN", 10),
                buildBanner("cmp-11", "Aksesuar Editi", "Cantadan cüzdana aksesuar secimleri.", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=2200&q=86", "/product/canta", "CAMPAIGN", 11),
                buildBanner("cmp-12", "Spor Giyim Performans", "Performans odakli spor giyim urunleri burada.", "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2200&q=86", "/product/esofman", "CAMPAIGN", 12)
        );
    }

    private ProductEntity buildProduct(String code,
                                       String title,
                                       String category,
                                       String brand,
                                       String imageUrl,
                                       String color,
                                       String size,
                                       double price,
                                       double oldPrice,
                                       int discountRate,
                                       double rating,
                                       int reviewCount,
                                       boolean freeCargo,
                                       boolean fastDelivery,
                                       double sellerScore,
                                       String installmentText,
                                       String sizeOptionsJson,
                                       String colorOptionsJson,
                                       String highlightsJson,
                                       String attributesJson) {
        ProductEntity entity = new ProductEntity();
        entity.setProductCode(code);
        entity.setTitle(title);
        entity.setCategory(category);
        entity.setBrand(brand);
        entity.setImageUrl(imageUrl);
        entity.setColor(color);
        entity.setSize(size);
        entity.setOldPrice(oldPrice);
        entity.setDiscountRate(discountRate);
        entity.setRating(rating);
        entity.setReviewCount(reviewCount);
        entity.setFreeCargo(freeCargo);
        entity.setPrice(price);
        entity.setFastDelivery(fastDelivery);
        entity.setSellerScore(sellerScore);
        entity.setInstallmentText(installmentText);
        entity.setSizeOptionsJson(sizeOptionsJson);
        entity.setColorOptionsJson(colorOptionsJson);
        entity.setHighlightsJson(highlightsJson);
        entity.setAttributesJson(attributesJson);
        return entity;
    }

    private PromotionBannerEntity buildBanner(String code,
                                              String title,
                                              String description,
                                              String imageUrl,
                                              String targetPath,
                                              String blockType,
                                              int sortOrder) {
        PromotionBannerEntity entity = new PromotionBannerEntity();
        entity.setBannerCode(code);
        entity.setTitle(title);
        entity.setDescription(description);
        entity.setImageUrl(imageUrl);
        entity.setTargetPath(targetPath);
        entity.setBlockType(blockType);
        entity.setSortOrder(sortOrder);
        return entity;
    }

    private List<ProductEntity> buildCategoryProducts(String category, CategorySeed seed) {
        List<ProductEntity> products = new ArrayList<>();
        for (int index = 0; index < 12; index++) {
            double price = 650 + (index * 130) + (category.length() * 17);
            double oldPrice = price + 220 + ((index % 5) * 90);
            int discountRate = Math.max(0, (int) Math.round(((oldPrice - price) / oldPrice) * 100));
            String code = category + "-" + (index + 1);
            String mark = BRANDS.get((index + category.length()) % BRANDS.size());
            String color = COLORS.get((index * 2 + category.length()) % COLORS.size());
            String size = SIZES.get((index + 1) % SIZES.size());
            List<String> sizeOptions = new ArrayList<>(new LinkedHashSet<>(List.of(
                    SIZES.get(index % SIZES.size()),
                    SIZES.get((index + 1) % SIZES.size()),
                    SIZES.get((index + 2) % SIZES.size()),
                    SIZES.get((index + 3) % SIZES.size())
            )));
            String primaryImage = seed.imagePool().get((index + category.length()) % seed.imagePool().size());
            List<Map<String, String>> colorOptions = List.of(
                    Map.of("name", color, "image", primaryImage),
                    Map.of(
                            "name", COLORS.get((index + 1 + category.length()) % COLORS.size()),
                            "image", seed.imagePool().get((index + 1) % seed.imagePool().size())
                    ),
                    Map.of(
                            "name", COLORS.get((index + 3 + category.length()) % COLORS.size()),
                            "image", seed.imagePool().get((index + 2) % seed.imagePool().size())
                    )
            );
            String prefix = TITLE_PREFIX.get((index + 3) % TITLE_PREFIX.size());
            String core = seed.productWords().get(index % seed.productWords().size());
            String fit = FIT_POOL.get(index % FIT_POOL.size());
            String fabric = FABRIC_POOL.get(index % FABRIC_POOL.size());
            String detailSuffix = DETAIL_SUFFIX_POOL.get(index % DETAIL_SUFFIX_POOL.size());
            String title = prefix + " " + core + " " + seed.suffixLabel() + " " + fit + " " + fabric + " " + detailSuffix;
            products.add(buildProduct(
                    code,
                    title,
                    category,
                    mark,
                    primaryImage,
                    color,
                    size,
                    price,
                    oldPrice,
                    discountRate,
                    3 + ((index + 1) % 3),
                    35 + (index * 19),
                    index % 2 == 0,
                    index % 3 != 0,
                    8.8 + ((index % 10) * 0.1),
                    INSTALLMENTS.get(index % INSTALLMENTS.size()),
                    encodeStringList(sizeOptions),
                    encodePairs(colorOptions, "name", "image"),
                    encodeStringList(List.of(
                            "Nefes alan kumas yapisi",
                            "Gun boyu konfor saglayan kesim",
                            "Sezon kombinlerine uyumlu modern tasarim"
                    )),
                    encodePairs(List.of(
                            Map.of("label", "Kalip", "value", fit),
                            Map.of("label", "Materyal", "value", fabric),
                            Map.of("label", "Renk", "value", color),
                            Map.of("label", "Beden", "value", size),
                            Map.of("label", "Mensei", "value", ORIGIN_POOL.get(index % ORIGIN_POOL.size()))
                    ), "label", "value")
            ));
        }
        return products;
    }

    private void upsertProduct(ProductRepository repository, ProductEntity seed) {
        ProductEntity entity = repository.findByProductCode(seed.getProductCode()).orElseGet(ProductEntity::new);
        entity.setProductCode(seed.getProductCode());
        entity.setTitle(seed.getTitle());
        entity.setCategory(seed.getCategory());
        entity.setBrand(seed.getBrand());
        entity.setImageUrl(seed.getImageUrl());
        entity.setColor(seed.getColor());
        entity.setSize(seed.getSize());
        entity.setOldPrice(seed.getOldPrice());
        entity.setDiscountRate(seed.getDiscountRate());
        entity.setRating(seed.getRating());
        entity.setReviewCount(seed.getReviewCount());
        entity.setFreeCargo(seed.isFreeCargo());
        entity.setPrice(seed.getPrice());
        entity.setFastDelivery(seed.isFastDelivery());
        entity.setSellerScore(seed.getSellerScore());
        entity.setInstallmentText(seed.getInstallmentText());
        entity.setSizeOptionsJson(seed.getSizeOptionsJson());
        entity.setColorOptionsJson(seed.getColorOptionsJson());
        entity.setHighlightsJson(seed.getHighlightsJson());
        entity.setAttributesJson(seed.getAttributesJson());
        repository.save(entity);
    }

    private String encodeStringList(List<String> values) {
        return values.stream()
                .map(this::encode)
                .reduce((left, right) -> left + "||" + right)
                .orElse("");
    }

    private String encodePairs(List<Map<String, String>> values, String leftKey, String rightKey) {
        return values.stream()
                .map(value -> encode(value.getOrDefault(leftKey, "")) + "::" + encode(value.getOrDefault(rightKey, "")))
                .reduce((left, right) -> left + "||" + right)
                .orElse("");
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private void upsertBanner(PromotionBannerRepository repository, PromotionBannerEntity seed) {
        PromotionBannerEntity entity = repository.findByBannerCode(seed.getBannerCode()).orElseGet(PromotionBannerEntity::new);
        entity.setBannerCode(seed.getBannerCode());
        entity.setTitle(seed.getTitle());
        entity.setDescription(seed.getDescription());
        entity.setImageUrl(seed.getImageUrl());
        entity.setTargetPath(seed.getTargetPath());
        entity.setBlockType(seed.getBlockType());
        entity.setSortOrder(seed.getSortOrder());
        repository.save(entity);
    }

    private CartItemEntity buildCartItem(String cartCode, String productCode, int quantity, double unitPrice) {
        CartItemEntity entity = new CartItemEntity();
        entity.setCartCode(cartCode);
        entity.setProductCode(productCode);
        entity.setQuantity(quantity);
        entity.setUnitPrice(unitPrice);
        return entity;
    }

    private record CategorySeed(String suffixLabel, List<String> productWords, List<String> imagePool) {
    }
}
