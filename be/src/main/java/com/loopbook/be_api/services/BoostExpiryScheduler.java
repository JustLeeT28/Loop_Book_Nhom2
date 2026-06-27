package com.loopbook.be_api.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class BoostExpiryScheduler {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Chạy mỗi 5 phút, tự động reset book hết hạn boost.
     * Set boosted = false, boost_expiry = NULL cho các book
     * có boost_expiry < NOW().
     */
    @Scheduled(fixedRate = 300_000) // 5 phút
    public void expireBoostedListings() {
        int updated = jdbcTemplate.update(
            "UPDATE lb_books SET boosted = false, boost_expiry = NULL " +
            "WHERE boosted = true AND boost_expiry IS NOT NULL AND boost_expiry < NOW()"
        );
        if (updated > 0) {
            log.info("BoostExpiryScheduler: Đã tự động reset boost cho {} listing hết hạn", updated);
        }
    }
}