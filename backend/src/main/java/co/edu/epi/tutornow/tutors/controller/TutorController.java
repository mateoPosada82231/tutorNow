package co.edu.epi.tutornow.tutors.controller;

import co.edu.epi.tutornow.tutors.dto.TutorProfileRequest;
import co.edu.epi.tutornow.tutors.dto.TutorResponse;
import co.edu.epi.tutornow.tutors.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;

    @PostMapping("/me")
    public ResponseEntity<TutorResponse> becomeTutor(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TutorProfileRequest request) {
        TutorResponse response = tutorService.becomeTutor(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<TutorResponse> getMyTutorProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(tutorService.getMyTutorProfile(userDetails.getUsername()));
    }

    @PutMapping("/me")
    public ResponseEntity<TutorResponse> updateMyTutorProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TutorProfileRequest request) {
        return ResponseEntity.ok(tutorService.updateMyTutorProfile(userDetails.getUsername(), request));
    }
}
