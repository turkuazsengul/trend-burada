package com.trendburada.catalog.application;

import java.util.List;

public record ProductFacet(
        String key,
        String title,
        List<FacetOption> options
) {
}
