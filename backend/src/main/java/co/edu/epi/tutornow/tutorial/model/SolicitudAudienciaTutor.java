package co.edu.epi.tutornow.tutorial.model;

import co.edu.epi.tutornow.tutors.model.Tutor;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Audiencia opcional de una solicitud: tutores seleccionados manualmente
 * por el estudiante que podran ver la publicacion. Sin filas para una
 * solicitud, la publicacion es visible para todos los tutores.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "solicitudes_asesoria_audiencia",
        uniqueConstraints = @UniqueConstraint(name = "uq_solicitud_audiencia", columnNames = {"solicitud_id", "tutor_id"})
)
public class SolicitudAudienciaTutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private SolicitudAsesoria solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;
}
