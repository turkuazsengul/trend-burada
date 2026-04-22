package com.trendburada.auth.domain;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCodeEntity, Long> {

    Optional<VerificationCodeEntity> findTopByUserIdAndCodeAndConsumedAtIsNullOrderByCreatedAtDesc(String userId, String code);

    List<VerificationCodeEntity> findByUserIdAndConsumedAtIsNull(String userId);

    List<VerificationCodeEntity> findByExpiresAtBeforeAndConsumedAtIsNull(OffsetDateTime time);
}
