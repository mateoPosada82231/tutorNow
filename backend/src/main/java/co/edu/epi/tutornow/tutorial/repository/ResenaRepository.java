package co.edu.epi.tutornow.tutorial.repository;

import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {

    Optional<Resena> findByAsesoriaIdAndAutorId(Long asesoriaId, Long autorId);

    boolean existsByAsesoriaIdAndAutorId(Long asesoriaId, Long autorId);

    long countByAsesoriaId(Long asesoriaId);

    @Query("""
            SELECT r FROM Resena r
            WHERE r.asesoria.tutor.id = :tutorId
              AND r.rolAutor = :rolAutor
              AND r.asesoria.estado = :estado
            ORDER BY r.createdAt DESC
            """)
    List<Resena> findPublicasPorTutor(
            @Param("tutorId") Long tutorId,
            @Param("rolAutor") RolAutorResena rolAutor,
            @Param("estado") EstadoAsesoria estado);

    @Query("""
            SELECT r FROM Resena r
            WHERE r.asesoria.estudiante.id = :estudianteId
              AND r.rolAutor = :rolAutor
              AND r.asesoria.estado = :estado
            ORDER BY r.createdAt DESC
            """)
    List<Resena> findRecibidasPorEstudiante(
            @Param("estudianteId") Long estudianteId,
            @Param("rolAutor") RolAutorResena rolAutor,
            @Param("estado") EstadoAsesoria estado);

    @Query("""
            SELECT AVG(r.rating), COUNT(r) FROM Resena r
            WHERE r.asesoria.tutor.id = :tutorId
              AND r.rolAutor = :rolAutor
              AND r.asesoria.estado = :estado
            """)
    Object[] calcularPromedioTutor(
            @Param("tutorId") Long tutorId,
            @Param("rolAutor") RolAutorResena rolAutor,
            @Param("estado") EstadoAsesoria estado);

    @Query("""
            SELECT AVG(r.rating), COUNT(r) FROM Resena r
            WHERE r.asesoria.estudiante.id = :estudianteId
              AND r.rolAutor = :rolAutor
              AND r.asesoria.estado = :estado
            """)
    Object[] calcularPromedioEstudiante(
            @Param("estudianteId") Long estudianteId,
            @Param("rolAutor") RolAutorResena rolAutor,
            @Param("estado") EstadoAsesoria estado);
}
