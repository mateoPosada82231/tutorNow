package co.edu.epi.tutornow.users.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "correo_electronico", nullable = false, unique = true)
    private String correoElectronico;

    @Column(name = "contrasena", nullable = false)
    private String contrasena;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "programa")
    private String programa;

    @Column(name = "semestre")
    private Integer semestre;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private Rol rol;

    @Column(name = "verificado", nullable = false)
    private boolean verificado;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "token_expiracion")
    private OffsetDateTime tokenExpiracion;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiracion")
    private OffsetDateTime resetTokenExpiracion;

    @Column(name = "cambio_token")
    private String cambioToken;

    @Column(name = "cambio_token_expiracion")
    private OffsetDateTime cambioTokenExpiracion;

    @Column(name = "contrasena_pendiente")
    private String contrasenaPendiente;

    @Column(name = "activo", nullable = false)
    private boolean activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
