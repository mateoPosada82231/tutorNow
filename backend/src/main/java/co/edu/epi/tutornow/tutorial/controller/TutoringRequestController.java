package co.edu.epi.tutornow.tutorial.controller;

import co.edu.epi.tutornow.common.dto.PageResponse;
import co.edu.epi.tutornow.tutorial.dto.CreateProposalRequest;
import co.edu.epi.tutornow.tutorial.dto.CreateTutoringRequest;
import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.service.PropuestaService;
import co.edu.epi.tutornow.tutorial.service.SolicitudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tutoring-requests")
@RequiredArgsConstructor
public class TutoringRequestController {

    private final SolicitudService solicitudService;
    private final PropuestaService propuestaService;

    @PostMapping
    public ResponseEntity<TutoringRequestResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateTutoringRequest request) {
        TutoringRequestResponse response = solicitudService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<TutoringRequestResponse>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long materiaId,
            @RequestParam(required = false) String modalidad,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<TutoringRequestResponse> response = solicitudService.list(
                userDetails.getUsername(), materiaId, modalidad, estado, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TutoringRequestResponse> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.getById(userDetails.getUsername(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        solicitudService.cancel(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/proposals")
    public ResponseEntity<List<ProposalResponse>> listProposals(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.listProposals(userDetails.getUsername(), id));
    }

    @PostMapping("/{id}/proposals")
    public ResponseEntity<ProposalResponse> createProposal(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CreateProposalRequest request) {
        ProposalResponse response = propuestaService.create(userDetails.getUsername(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
