package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.common.exception.ConflictException;
import co.edu.epi.tutornow.common.exception.ForbiddenException;
import co.edu.epi.tutornow.common.exception.ResourceNotFoundException;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.dto.CreateProposalRequest;
import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoPropuesta;
import co.edu.epi.tutornow.tutorial.model.EstadoSolicitud;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutorial.repository.AsesoriaRepository;
import co.edu.epi.tutornow.tutorial.repository.PropuestaRepository;
import co.edu.epi.tutornow.tutorial.repository.SolicitudAsesoriaRepository;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.tutors.repository.TutorRepository;
import co.edu.epi.tutornow.users.model.Rol;
import co.edu.epi.tutornow.users.model.Usuario;
import co.edu.epi.tutornow.users.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropuestaService {

    private final PropuestaRepository propuestaRepository;
    private final SolicitudAsesoriaRepository solicitudRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TutorRepository tutorRepository;
    private final TutorialMapper mapper;

    @Transactional
    public ProposalResponse create(String correo, Long solicitudId, CreateProposalRequest request) {
        Usuario usuario = findUsuario(correo);
        if (usuario.getRol() != Rol.TUTOR) {
            throw new ForbiddenException("Solo los tutores pueden enviar propuestas");
        }
        Tutor tutor = tutorRepository.findByUsuario_CorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("No tienes un perfil de tutor"));
        SolicitudAsesoria solicitud = findSolicitud(solicitudId);
        if (solicitud.getEstudiante().getId().equals(usuario.getId())) {
            throw new ForbiddenException("No puedes enviar una propuesta a tu propia asesoria");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CANCELADA) {
            throw new ConflictException("La asesoria fue cancelada");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CONFIRMADA) {
            throw new ConflictException("La asesoria ya fue confirmada");
        }
        if (propuestaRepository.existsBySolicitudIdAndTutorId(solicitudId, tutor.getId())) {
            throw new ConflictException("Ya enviaste una propuesta a esta asesoria");
        }
        Propuesta propuesta = Propuesta.builder()
                .solicitud(solicitud)
                .tutor(tutor)
                .mensaje(request.getMensaje().trim())
                .estado(EstadoPropuesta.PENDIENTE)
                .build();
        propuesta = propuestaRepository.save(propuesta);
        if (solicitud.getEstado() == EstadoSolicitud.PUBLICADA) {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
            solicitudRepository.save(solicitud);
        }
        return mapper.toProposalResponse(propuesta, true);
    }

    @Transactional
    public TutoringRequestResponse accept(String correo, Long propuestaId) {
        Propuesta propuesta = findPropuesta(propuestaId);
        SolicitudAsesoria solicitud = propuesta.getSolicitud();
        if (!solicitud.getEstudiante().getCorreoElectronico().equals(correo)) {
            throw new ForbiddenException("Solo el estudiante que publico la asesoria puede aceptar propuestas");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CONFIRMADA) {
            throw new ConflictException("La asesoria ya fue confirmada");
        }
        if (solicitud.getEstado() == EstadoSolicitud.CANCELADA) {
            throw new ConflictException("La asesoria fue cancelada");
        }
        if (propuesta.getEstado() != EstadoPropuesta.PENDIENTE) {
            throw new ConflictException("La propuesta ya fue procesada");
        }
        if (asesoriaRepository.existsBySolicitudId(solicitud.getId())) {
            throw new ConflictException("La asesoria ya fue seleccionada para esta asesoria");
        }
        propuesta.setEstado(EstadoPropuesta.ACEPTADA);
        propuestaRepository.save(propuesta);

        List<Propuesta> restantes = propuestaRepository.findBySolicitudIdAndEstadoOrderByCreatedAtAsc(
                solicitud.getId(), EstadoPropuesta.PENDIENTE);
        restantes.forEach(p -> p.setEstado(EstadoPropuesta.RECHAZADA));
        propuestaRepository.saveAll(restantes);

        solicitud.setEstado(EstadoSolicitud.CONFIRMADA);
        solicitudRepository.save(solicitud);

        Asesoria asesoria = Asesoria.builder()
                .solicitud(solicitud)
                .propuesta(propuesta)
                .estudiante(solicitud.getEstudiante())
                .tutor(propuesta.getTutor())
                .estado(EstadoAsesoria.PENDIENTE)
                .build();
        asesoria = asesoriaRepository.save(asesoria);
        AsesoriaResponse asesoriaResponse = mapper.toAsesoriaResponse(asesoria);

        List<ProposalResponse> propuestas = propuestaRepository
                .findBySolicitudIdOrderByCreatedAtAsc(solicitud.getId()).stream()
                .map(p -> mapper.toProposalResponse(p, false))
                .toList();
        return mapper.toSolicitudResponse(
                solicitud.getEstudiante(), solicitud, propuestas.size(), propuestas, null, asesoriaResponse);
    }

    @Transactional
    public ProposalResponse reject(String correo, Long propuestaId) {
        Propuesta propuesta = findPropuesta(propuestaId);
        SolicitudAsesoria solicitud = propuesta.getSolicitud();
        boolean owner = solicitud.getEstudiante().getCorreoElectronico().equals(correo);
        boolean proponente = propuesta.getTutor().getUsuario().getCorreoElectronico().equals(correo);
        if (!owner && !proponente) {
            throw new ForbiddenException("No tienes permiso sobre esta propuesta");
        }
        if (propuesta.getEstado() != EstadoPropuesta.PENDIENTE) {
            throw new ConflictException("La propuesta ya fue procesada");
        }
        propuesta.setEstado(EstadoPropuesta.RECHAZADA);
        propuesta = propuestaRepository.save(propuesta);
        return mapper.toProposalResponse(propuesta, proponente);
    }

    private Usuario findUsuario(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private SolicitudAsesoria findSolicitud(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoria no encontrada"));
    }

    private Propuesta findPropuesta(Long id) {
        return propuestaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Propuesta no encontrada"));
    }
}
