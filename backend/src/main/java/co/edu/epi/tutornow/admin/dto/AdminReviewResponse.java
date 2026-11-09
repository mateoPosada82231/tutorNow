package co.edu.epi.tutornow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminReviewResponse {

    private Long id;
    private Long asesoriaId;
    private String rolAutor;
    private Integer rating;
    private String comentario;
    private String estadoModeracion;
    private OffsetDateTime createdAt;
    private ActorResponse autor;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ActorResponse {
        private Long id;
        private String fullName;
        private String email;
    }
}
