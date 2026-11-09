package co.edu.epi.tutornow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminUserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;
    private boolean active;
    private boolean verified;
    private boolean hasTutorProfile;
    private OffsetDateTime createdAt;
    private RatingSummaryResponse tutorReviews;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class RatingSummaryResponse {
        private Double averageRating;
        private long reviewCount;
    }
}
