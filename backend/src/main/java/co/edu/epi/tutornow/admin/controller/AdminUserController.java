package co.edu.epi.tutornow.admin.controller;

import co.edu.epi.tutornow.admin.dto.AdminUserResponse;
import co.edu.epi.tutornow.admin.service.AdminUserService;
import co.edu.epi.tutornow.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> list(
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.list(rol, activo, q, page, size));
    }

    @PutMapping("/{id}/revoke-tutor")
    public ResponseEntity<AdminUserResponse> revokeTutor(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.revokeTutor(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/restore-tutor")
    public ResponseEntity<AdminUserResponse> restoreTutor(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.restoreTutor(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<AdminUserResponse> deactivate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.deactivate(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<AdminUserResponse> activate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.activate(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}/promote-admin")
    public ResponseEntity<AdminUserResponse> promoteAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.promoteAdmin(userDetails.getUsername(), id));
    }
}
