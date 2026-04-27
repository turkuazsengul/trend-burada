package com.trendburada.catalog.application;

import java.util.List;

public record CategoryTreeNode(
        String id,
        String label,
        List<CategoryTreeNode> children
) {
}
