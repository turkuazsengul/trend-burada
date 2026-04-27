package com.trendburada.catalog.application;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Encodes / decodes the URL-encoded {@code "||"}-delimited blobs that the catalog stores in
 * {@code ProductEntity}'s {@code *_options_json} columns.
 *
 * <p>Format (per column):
 * <ul>
 *   <li><b>String list</b> ({@code sizeOptions}, {@code highlights}):
 *       {@code URLEncode(item) || URLEncode(item) || ...}</li>
 *   <li><b>Pair list</b> ({@code colorOptions}, {@code attributes}):
 *       {@code URLEncode(left) :: URLEncode(right) || ...}</li>
 * </ul>
 *
 * <p>The columns are misnamed {@code *_json} for historical reasons — they are NOT JSON, they
 * are this hand-rolled blob. Normalising them to a real type is tracked separately
 * (TB-09 product entity normalisation); this utility just isolates the existing format so the
 * service no longer carries 90+ lines of string plumbing.
 *
 * <p>All methods are pure and null-safe: {@code null}/blank inputs round-trip to empty
 * lists / empty strings.
 */
final class ProductPayloadCodec {

    private static final String LIST_SEPARATOR = "||";
    private static final String PAIR_SEPARATOR = "::";

    private ProductPayloadCodec() {
    }

    static List<String> readStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<String> parsed = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            if (!token.isBlank()) {
                parsed.add(decode(token));
            }
        }
        return parsed;
    }

    static List<ProductColorOption> readColorOptions(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<ProductColorOption> options = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            String[] parts = token.split(PAIR_SEPARATOR, 2);
            if (parts.length == 2) {
                options.add(new ProductColorOption(decode(parts[0]), decode(parts[1])));
            }
        }
        return options;
    }

    static List<ProductAttribute> readAttributes(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<ProductAttribute> attributes = new ArrayList<>();
        for (String token : value.split("\\|\\|")) {
            String[] parts = token.split(PAIR_SEPARATOR, 2);
            if (parts.length == 2) {
                attributes.add(new ProductAttribute(decode(parts[0]), decode(parts[1])));
            }
        }
        return attributes;
    }

    static String encodeStringList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .filter(item -> item != null && !item.isBlank())
                .map(ProductPayloadCodec::encode)
                .reduce((left, right) -> left + LIST_SEPARATOR + right)
                .orElse("");
    }

    static String encodeColorOptions(List<ProductColorOption> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .filter(item -> item != null)
                .map(item -> encode(nullToEmpty(item.name())) + PAIR_SEPARATOR + encode(nullToEmpty(item.image())))
                .reduce((left, right) -> left + LIST_SEPARATOR + right)
                .orElse("");
    }

    static String encodeAttributes(List<ProductAttribute> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .filter(item -> item != null)
                .map(item -> encode(nullToEmpty(item.label())) + PAIR_SEPARATOR + encode(nullToEmpty(item.value())))
                .reduce((left, right) -> left + LIST_SEPARATOR + right)
                .orElse("");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
