package co.edu.epi.tutornow.reports.controller;

import co.edu.epi.tutornow.reports.dto.CreateReportRequest;
import co.edu.epi.tutornow.reports.dto.ReportResponse;
import co.edu.epi.tutornow.reports.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReportRequest request) {
        ReportResponse report = reportService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }
}
