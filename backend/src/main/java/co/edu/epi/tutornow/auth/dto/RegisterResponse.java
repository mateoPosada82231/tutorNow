package co.edu.epi.tutornow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;

    @JsonProperty("requiresVerification")
    private boolean requiresVerification;

    private String message;
}
