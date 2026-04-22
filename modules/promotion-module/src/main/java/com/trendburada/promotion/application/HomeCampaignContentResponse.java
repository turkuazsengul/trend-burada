package com.trendburada.promotion.application;

import java.util.List;

public record HomeCampaignContentResponse(
        List<HomepageContentBlock> heroBlocks,
        List<HomepageContentBlock> campaignBlocks,
        List<HomepageContentBlock> showcaseBlocks
) {
}
