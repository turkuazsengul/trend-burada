package com.trendburada.catalog.application;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class CatalogReferenceService {

    private static final List<String> BRAND_NAMES = List.of(
            "Zara", "Mango", "Koton", "Ipekyol", "Mavi", "Stradivarius", "H&M", "LCW Vision", "Massimo"
    );

    private static final List<CategoryTreeNode> CATEGORY_TREE = List.of(
            node("kadin", "Kadin",
                    leaf("elbise", "Elbise"),
                    leaf("tisort", "Tisort"),
                    leaf("gomlek", "Gomlek"),
                    leaf("pantolon", "Pantolon"),
                    leaf("ceket", "Ceket"),
                    leaf("triko", "Triko")
            ),
            node("erkek", "Erkek",
                    leaf("erkek-tisort", "Tisort"),
                    leaf("erkek-gomlek", "Gomlek"),
                    leaf("jean", "Jean"),
                    leaf("erkek-pantolon", "Pantolon"),
                    leaf("sweatshirt", "Sweatshirt"),
                    leaf("mont", "Mont")
            ),
            node("cocuk", "Cocuk",
                    leaf("kiz-cocuk", "Kiz Cocuk"),
                    leaf("erkek-cocuk", "Erkek Cocuk"),
                    leaf("bebek-giyim", "Bebek Giyim"),
                    leaf("okul-kombinleri", "Okul Kombinleri")
            ),
            node("ayakkabi", "Ayakkabi",
                    leaf("sneaker", "Sneaker"),
                    leaf("bot", "Bot"),
                    leaf("topuklu-ayakkabi", "Topuklu Ayakkabi"),
                    leaf("loafer", "Loafer"),
                    leaf("sandalet", "Sandalet")
            ),
            node("aksesuar", "Aksesuar",
                    leaf("canta", "Canta"),
                    leaf("kemer", "Kemer"),
                    leaf("cuzdan", "Cuzdan"),
                    leaf("taki", "Taki"),
                    leaf("sapka", "Sapka")
            ),
            node("spor", "Spor",
                    leaf("esofman", "Esofman"),
                    leaf("tayt", "Tayt"),
                    leaf("spor-sutyeni", "Spor Sutyeni"),
                    leaf("hoodie", "Hoodie"),
                    leaf("kosu-urunleri", "Kosu Urunleri")
            )
    );

    public List<BrandOption> getBrands() {
        return BRAND_NAMES.stream()
                .map(name -> new BrandOption(toId(name), name))
                .toList();
    }

    public List<CategoryTreeNode> getCategoryTree() {
        return CATEGORY_TREE;
    }

    private static CategoryTreeNode node(String id, String label, CategoryTreeNode... children) {
        return new CategoryTreeNode(id, label, List.of(children));
    }

    private static CategoryTreeNode leaf(String id, String label) {
        return new CategoryTreeNode(id, label, List.of());
    }

    private static String toId(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace("&", "and")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
