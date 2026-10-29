package co.edu.epi.tutornow.chat.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_lecturas")
public class ChatLectura {

    @EmbeddedId
    private ChatLecturaId id;

    @Column(name = "ultimo_leido_id")
    private Long ultimoLeidoId;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
