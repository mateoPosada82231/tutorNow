package co.edu.epi.tutornow.chat.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Getter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class ChatLecturaId implements Serializable {

    @Column(name = "asesoria_id")
    private Long asesoriaId;

    @Column(name = "usuario_id")
    private Long usuarioId;
}
