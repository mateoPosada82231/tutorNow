package co.edu.epi.tutornow.admin.controller;

import co.edu.epi.tutornow.admin.dto.AdminPublicationResponse;
import co.edu.epi.tutornow.admin.dto.AdminReviewResponse;
import co.edu.epi.tutornow.admin.service.AdminModerationService;
import co.edu.epi.tutornow.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminModerationController {

    private final AdminModerationService adminModerationService;

    @GetMapping("/publications")
    public ResponseEntity<PageResponse<AdminPublicationResponse>> listPublications(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String moderacion,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                adminModerationService.listPublications(estado, moderacion, q, page, size));
    }

    @PutMapping("/publications/{id}/withdraw")
    public ResponseEntity<AdminPublicationResponse> withdrawPublication(@PathVariable Long id) {
        return ResponseEntity.ok(adminModerationService.withdrawPublication(id));
    }

    @GetMapping("/reviews")
    public ResponseEntity<PageResponse<AdminReviewResponse>> listReviews(
            @RequestParam(required = false) String moderacion,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminModerationService.listReviews(moderacion, q, page, size));
    }

    @PutMapping("/reviews/{id}/withdraw")
    public ResponseEntity<AdminReviewResponse> withdrawReview(@PathVariable Long id) {
        return ResponseEntity.ok(adminModerationService.withdrawReview(id));
    }
}
