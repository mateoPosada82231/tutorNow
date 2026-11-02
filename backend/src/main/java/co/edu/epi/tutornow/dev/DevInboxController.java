package co.edu.epi.tutornow.dev;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevInboxController {

    private final SimulatedEmailStore simulatedEmailStore;

    @GetMapping("/inbox")
    public ResponseEntity<List<SimulatedEmailResponse>> inbox() {
        List<SimulatedEmailResponse> emails = simulatedEmailStore.findAll().stream()
                .map(SimulatedEmailResponse::from)
                .toList();
        return ResponseEntity.ok(emails);
    }
}
