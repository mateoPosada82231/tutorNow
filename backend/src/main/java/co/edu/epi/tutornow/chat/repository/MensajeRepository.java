package co.edu.epi.tutornow.chat.repository;

import co.edu.epi.tutornow.chat.model.Mensaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    Optional<Mensaje> findByAsesoriaIdAndClientMessageId(Long asesoriaId, String clientMessageId);

    Optional<Mensaje> findFirstByAsesoriaIdOrderByIdDesc(Long asesoriaId);

    @EntityGraph(attributePaths = "emisor")
    Page<Mensaje> findByAsesoriaIdOrderByIdDesc(Long asesoriaId, Pageable pageable);

    @EntityGraph(attributePaths = "emisor")
    Page<Mensaje> findByAsesoriaIdAndIdLessThanOrderByIdDesc(Long asesoriaId, Long before, Pageable pageable);

    @Query("""
            SELECT m.asesoria.id, COUNT(m)
            FROM Mensaje m
            WHERE m.asesoria.id IN :asesoriaIds
              AND m.emisor.id <> :usuarioId
              AND m.id > COALESCE(
                  (SELECT cl.ultimoLeidoId FROM ChatLectura cl
                   WHERE cl.id.asesoriaId = m.asesoria.id AND cl.id.usuarioId = :usuarioId), 0)
            GROUP BY m.asesoria.id
            """)
    List<Object[]> countNoLeidos(
            @Param("asesoriaIds") Collection<Long> asesoriaIds,
            @Param("usuarioId") Long usuarioId);
}
