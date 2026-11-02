package co.edu.epi.tutornow.dev;

import java.time.OffsetDateTime;

public record SimulatedEmail(
        String to,
        String subject,
        String content,
        String link,
        String kind,
        OffsetDateTime createdAt
) {
}
