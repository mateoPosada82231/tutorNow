package co.edu.epi.tutornow.tutorial.controller;

import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.service.PropuestaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final PropuestaService propuestaService;

    @PutMapping("/{id}/accept")
    public ResponseEntity<TutoringRequestResponse> accept(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(propuestaService.accept(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ProposalResponse> reject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(propuestaService.reject(userDetails.getUsername(), id));
    }
}
