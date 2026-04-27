package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductAttributeEmbeddable;
import com.trendburada.catalog.domain.ProductColorOptionEmbeddable;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses the legacy URL-encoded {@code "||"}-delimited blob columns
 * (`size_options_json`, `color_options_json`, `highlights_json`,
 * `attributes_json`) on {@code catalog.products}.
 *
 * <p>Used only by {@code ProductOptionsBackfill} to migrate historical
 * rows into the new relational option tables introduced in TB-09. After
 * the backfill is verified and the legacy columns are dropped, this
 * class can be deleted along with them.
 *
 * <p>The blob format (kept here for the record):
 * <ul>
 *   <li>String list: {@code URLEncode(item) || URLEncode(item) || …}</li>
 *   <li>Pair list:   {@code URLEncode(left) :: URLEncode(right) || …}</li>
 * </ul>
 */
final class ProductOptionsLegacyParser {

    private static final String LIST_SEPARATOR = "\\|\\|";
    private static final String PAIR_SEPARATOR = "::";

    private ProductOptionsLegacyParser() {
    }

    static List<String> readStringList(String blob) {
        if (blob == null || blob.isBlank()) {
            return List.of();
        }
        List<String> parsed = new ArrayList<>();
        for (String token : blob.split(LIST_SEPARATOR)) {
            if (!token.isBlank()) {
                parsed.add(decode(token));
            }
        }
        return parsed;
    }

    static List<ProductColorOptionEmbeddable> readColorOptions(String blob) {
        if (blob == null || blob.isBlank()) {
            return List.of();
        }
        List<ProductColorOptionEmbeddable> options = new ArrayList<>();
        for (String token : blob.split(LIST_SEPARATOR)) {
            String[] parts = token.split(PAIR_SEPARATOR, 2);
            if (parts.length == 2) {
                options.add(new ProductColorOptionEmbeddable(decode(parts[0]), decode(parts[1])));
            }
        }
        return options;
    }

    static List<ProductAttributeEmbeddable> readAttributes(String blob) {
        if (blob == null || blob.isBlank()) {
            return List.of();
        }
        List<ProductAttributeEmbeddable> attrs = new ArrayList<>();
        for (String token : blob.split(LIST_SEPARATOR)) {
            String[] parts = token.split(PAIR_SEPARATOR, 2);
            if (parts.length == 2) {
                attrs.add(new ProductAttributeEmbeddable(decode(parts[0]), decode(parts[1])));
            }
        }
        return attrs;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
