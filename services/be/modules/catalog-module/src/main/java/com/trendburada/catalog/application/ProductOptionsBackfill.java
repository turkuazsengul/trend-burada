package com.trendburada.catalog.application;

import com.trendburada.catalog.domain.ProductEntity;
import com.trendburada.catalog.domain.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-shot migration of legacy URL-encoded blob columns
 * ({@code size_options_json}, {@code color_options_json},
 * {@code highlights_json}, {@code attributes_json}) into the relational
 * tables introduced in TB-09.
 *
 * <p>Runs on every {@link ContextRefreshedEvent} (matches the existing
 * convention from {@code KeycloakRealmBootstrap} and avoids dragging the
 * {@code spring-boot} dep into {@code catalog-module}). Idempotent: only
 * touches rows where the new collection is empty AND the legacy column
 * is non-empty. Once a row's been migrated the new collection is
 * non-empty, so subsequent boots skip it. After the legacy columns are
 * dropped (separate follow-up migration), this component is dead code
 * and can be deleted.
 *
 * <p>Failures are caught and logged per row rather than thrown — a
 * single malformed legacy blob shouldn't keep the whole app from
 * starting. The row stays unmigrated; you can hand-fix the blob and
 * re-boot, or accept the data loss.
 */
@Component
public class ProductOptionsBackfill {

    private static final Logger log = LoggerFactory.getLogger(ProductOptionsBackfill.class);

    private final ProductRepository productRepository;

    public ProductOptionsBackfill(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @EventListener(ContextRefreshedEvent.class)
    @Transactional
    public void backfill() {
        int migrated = 0;
        int skipped = 0;
        int failed = 0;
        for (ProductEntity p : productRepository.findAll()) {
            try {
                if (migrateOne(p)) {
                    migrated++;
                } else {
                    skipped++;
                }
            } catch (RuntimeException ex) {
                log.warn("ProductOptionsBackfill: row {} failed: {}", p.getId(), ex.getMessage());
                failed++;
            }
        }
        if (migrated > 0 || failed > 0) {
            log.info("ProductOptionsBackfill: migrated={} skipped={} failed={}", migrated, skipped, failed);
        }
    }

    private boolean migrateOne(ProductEntity p) {
        boolean touched = false;

        if (p.getSizeOptions().isEmpty() && hasContent(p.getSizeOptionsJson())) {
            p.setSizeOptions(new java.util.ArrayList<>(
                    ProductOptionsLegacyParser.readStringList(p.getSizeOptionsJson())));
            touched = true;
        }
        if (p.getColorOptions().isEmpty() && hasContent(p.getColorOptionsJson())) {
            p.setColorOptions(new java.util.ArrayList<>(
                    ProductOptionsLegacyParser.readColorOptions(p.getColorOptionsJson())));
            touched = true;
        }
        if (p.getHighlights().isEmpty() && hasContent(p.getHighlightsJson())) {
            p.setHighlights(new java.util.ArrayList<>(
                    ProductOptionsLegacyParser.readStringList(p.getHighlightsJson())));
            touched = true;
        }
        if (p.getAttributes().isEmpty() && hasContent(p.getAttributesJson())) {
            p.setAttributes(new java.util.ArrayList<>(
                    ProductOptionsLegacyParser.readAttributes(p.getAttributesJson())));
            touched = true;
        }

        if (touched) {
            productRepository.save(p);
        }
        return touched;
    }

    private static boolean hasContent(String blob) {
        return blob != null && !blob.isBlank();
    }
}
