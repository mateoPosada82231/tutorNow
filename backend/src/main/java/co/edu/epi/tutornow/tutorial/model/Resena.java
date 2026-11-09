package co.edu.epi.tutornow.tutorial.model;

import co.edu.epi.tutornow.users.model.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "resenas_asesoria", uniqueConstraints = @UniqueConstraint(
        name = "uniq_resena_autor_asesoria",
        columnNames = {"asesoria_id", "autor_id"}))
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asesoria_id", nullable = false)
    private Asesoria asesoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol_autor", nullable = false, length = 10)
    private RolAutorResena rolAutor;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comentario", nullable = false, length = 500)
    private String comentario;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_moderacion", nullable = false, length = 20)
    private EstadoModeracion estadoModeracion = EstadoModeracion.VISIBLE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
