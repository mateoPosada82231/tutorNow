package co.edu.epi.tutornow.dev;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatedEmailResponse {

    @JsonProperty("to")
    private String to;

    @JsonProperty("subject")
    private String subject;

    @JsonProperty("content")
    private String content;

    @JsonProperty("link")
    private String link;

    @JsonProperty("kind")
    private String kind;

    @JsonProperty("createdAt")
    private OffsetDateTime createdAt;

    public static SimulatedEmailResponse from(SimulatedEmail email) {
        return SimulatedEmailResponse.builder()
                .to(email.to())
                .subject(email.subject())
                .content(email.content())
                .link(email.link())
                .kind(email.kind())
                .createdAt(email.createdAt())
                .build();
    }
}
