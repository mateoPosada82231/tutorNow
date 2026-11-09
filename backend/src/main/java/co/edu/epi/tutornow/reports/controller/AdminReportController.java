package co.edu.epi.tutornow.reports.controller;

import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportDetailResponse;
import co.edu.epi.tutornow.reports.dto.AdminReportResponse;
import co.edu.epi.tutornow.reports.dto.ResolveReportRequest;
import co.edu.epi.tutornow.reports.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminReportResponse>> list(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String tipo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.list(estado, tipo, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminReportDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getById(id));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<AdminReportResponse> resolve(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request) {
        return ResponseEntity.ok(reportService.resolve(id, request, userDetails.getUsername()));
    }

    @PutMapping("/{id}/dismiss")
    public ResponseEntity<AdminReportResponse> dismiss(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request) {
        return ResponseEntity.ok(reportService.dismiss(id, request, userDetails.getUsername()));
    }
}
