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
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainDataInitializer {

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

            if (productRepository.count() == 0) {
                productRepository.save(buildProduct(
                        "prd-101",
                        "Premium Oversize Triko",
                        "kadin",
                        "Zara",
                        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
                        1399.90,
                        true
                ));
                productRepository.save(buildProduct(
                        "prd-102",
                        "Modern Poplin Gomlek",
                        "erkek",
                        "Mango Man",
                        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
                        1199.90,
                        true
                ));
                productRepository.save(buildProduct(
                        "prd-103",
                        "Minimal Sneaker",
                        "ayakkabi",
                        "Massimo",
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
                        2199.90,
                        false
                ));
            }

            if (promotionBannerRepository.count() == 0) {
                promotionBannerRepository.save(buildBanner(
                        "cmp-1",
                        "Yaz Kombinleri",
                        "Sezonun en yeni parcalarini kesfet, gunun stilini tek tikla tamamla.",
                        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80",
                        "/kadin/yeni-sezon",
                        "HERO",
                        1
                ));
                promotionBannerRepository.save(buildBanner(
                        "cmp-2",
                        "Sepette Ekstra Indirim",
                        "Secili urunlerde kacirilmayacak kampanya firsatlari seni bekliyor.",
                        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
                        "/kampanyalar/sepet-indirimi",
                        "CAMPAIGN",
                        2
                ));
                promotionBannerRepository.save(buildBanner(
                        "cmp-3",
                        "Sneaker Vitrini",
                        "Bu haftanin one cikan ayakkabi modellerini vitrine tasidik.",
                        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
                        "/vitrin/sneaker",
                        "SHOWCASE",
                        3
                ));
            }

            if (favoriteRepository.count() == 0) {
                FavoriteEntity favorite = new FavoriteEntity();
                favorite.setCustomerCode("cust-1001");
                favorite.setProductCode("prd-101");
                favoriteRepository.save(favorite);
            }

            if (orderRepository.count() == 0) {
                OrderEntity order = new OrderEntity();
                order.setOrderCode("ord-20260422-1");
                order.setCustomerCode("cust-1001");
                order.setStatus("SHIPPED");
                order.setTotalAmount(2750.50);
                orderRepository.save(order);
            }

            if (cartRepository.count() == 0) {
                CartEntity cart = new CartEntity();
                cart.setCartCode("cart-1001");
                cart.setCustomerCode("cust-1001");
                cartRepository.save(cart);

                cartItemRepository.save(buildCartItem("cart-1001", "prd-101", 1, 1399.90));
                cartItemRepository.save(buildCartItem("cart-1001", "prd-102", 2, 1199.90));
            }
        };
    }

    private ProductEntity buildProduct(String code,
                                       String title,
                                       String category,
                                       String brand,
                                       String imageUrl,
                                       double price,
                                       boolean fastDelivery) {
        ProductEntity entity = new ProductEntity();
        entity.setProductCode(code);
        entity.setTitle(title);
        entity.setCategory(category);
        entity.setBrand(brand);
        entity.setImageUrl(imageUrl);
        entity.setPrice(price);
        entity.setFastDelivery(fastDelivery);
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

    private CartItemEntity buildCartItem(String cartCode, String productCode, int quantity, double unitPrice) {
        CartItemEntity entity = new CartItemEntity();
        entity.setCartCode(cartCode);
        entity.setProductCode(productCode);
        entity.setQuantity(quantity);
        entity.setUnitPrice(unitPrice);
        return entity;
    }
}
