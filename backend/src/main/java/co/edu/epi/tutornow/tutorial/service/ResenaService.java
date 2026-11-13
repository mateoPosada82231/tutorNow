package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.dto.MisResenasResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaPendienteResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaRecibidaResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaRequest;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoModeracion;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.RolAutorResena;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.repository.ResenaRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private final ResenaRepository resenaRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TutorRepository tutorRepository;
    private final TutorialMapper mapper;

    @Transactional
    public AsesoriaResponse crear(String correo, Long asesoriaId, ResenaRequest request) {
        Usuario usuario = findUsuario(correo);
        Asesoria asesoria = asesoriaRepository.findByIdConParticipantesForUpdate(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoria no encontrada"));

        boolean esEstudiante = asesoria.getEstudiante().getId().equals(usuario.getId());
        boolean esTutor = asesoria.getTutor().getUsuario().getId().equals(usuario.getId());
        if (!esEstudiante && !esTutor) {
            throw new ForbiddenException("Solo las partes de la asesoria pueden evaluarla");
        }
        if (asesoria.getEstado() == EstadoAsesoria.CANCELADA) {
            throw new ConflictException("La asesoria fue cancelada y no se puede evaluar");
        }
        if (asesoria.getEstado() == EstadoAsesoria.EVALUADA) {
            throw new ConflictException("La asesoria ya fue evaluada");
        }
        if (asesoria.getEstado() != EstadoAsesoria.FINALIZADA) {
            throw new ConflictException("La asesoria aun no ha finalizado");
        }
        if (resenaRepository.existsByAsesoriaIdAndAutorId(asesoriaId, usuario.getId())) {
            throw new ConflictException("Ya enviaste tu resena para esta asesoria");
        }

        String comentario = request.getComentario() == null ? "" : request.getComentario().trim();
        if (comentario.length() < 5 || comentario.length() > 500) {
            throw new IllegalArgumentException("El comentario debe tener entre 5 y 500 caracteres");
        }

        Resena resena = Resena.builder()
                .asesoria(asesoria)
                .autor(usuario)
                .rolAutor(esEstudiante ? RolAutorResena.ESTUDIANTE : RolAutorResena.TUTOR)
                .rating(request.getRating())
                .comentario(comentario)
                .build();
        resenaRepository.save(resena);

        asesoria.getResenas().add(resena);
        long resenasVisibles = resenaRepository.countByAsesoriaIdAndEstadoModeracion(
                asesoria.getId(), EstadoModeracion.VISIBLE);
        if (resenasVisibles >= 2) {
            asesoria.setEstado(EstadoAsesoria.EVALUADA);
            asesoriaRepository.save(asesoria);
        }

        return mapper.toAsesoriaResponse(asesoria, usuario);
    }

    @Transactional(readOnly = true)
    public MisResenasResponse obtenerMisResenas(String correo) {
        Usuario usuario = findUsuario(correo);

        boolean esTutor = usuario.getRol() == Rol.TUTOR;

        List<Resena> resenasRecibidasRaw;
        if (esTutor) {
            Tutor tutor = tutorRepository.findByUsuario_Id(usuario.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tutor no encontrado"));
            resenasRecibidasRaw = resenaRepository.findPublicasPorTutor(
                    tutor.getId(), RolAutorResena.ESTUDIANTE, EstadoAsesoria.EVALUADA);
        } else {
            resenasRecibidasRaw = resenaRepository.findRecibidasPorEstudiante(
                    usuario.getId(), RolAutorResena.TUTOR, EstadoAsesoria.EVALUADA);
        }

        List<ResenaRecibidaResponse> recibidas = resenasRecibidasRaw.stream()
                .map(r -> ResenaRecibidaResponse.builder()
                        .id(r.getId())
                        .rating(r.getRating())
                        .comentario(r.getComentario())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();

        Double promedio = null;
        long total = recibidas.size();
        if (!recibidas.isEmpty()) {
            double suma = recibidas.stream()
                    .mapToDouble(ResenaRecibidaResponse::getRating)
                    .sum();
            promedio = redondear(suma / recibidas.size());
        }

        List<ResenaPendienteResponse> pendientes = asesoriaRepository
                .findPendientesDeResena(usuario.getId(), EstadoAsesoria.FINALIZADA)
                .stream()
                .map(a -> ResenaPendienteResponse.builder()
                        .asesoriaId(a.getId())
                        .solicitudId(a.getSolicitud().getId())
                        .tema(a.getSolicitud().getTema())
                        .contraparte(contraparte(a, usuario))
                        .finalizadaAt(a.getFinalizadaAt())
                        .build())
                .toList();

        return MisResenasResponse.builder()
                .promedioRating(promedio)
                .totalResenas(total)
                .resenasRecibidas(recibidas)
                .pendientes(pendientes)
                .build();
    }

    private String contraparte(Asesoria asesoria, Usuario usuario) {
        if (asesoria.getEstudiante().getId().equals(usuario.getId())) {
            return asesoria.getTutor().getUsuario().getNombreCompleto();
        }
        return asesoria.getEstudiante().getNombreCompleto();
    }

    private Usuario findUsuario(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private double redondear(double valor) {
        return BigDecimal.valueOf(valor)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
