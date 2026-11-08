package co.edu.epi.tutornow.tutorial.service;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import co.edu.epi.tutornow.tutorial.dto.AsesoriaResponse;
import co.edu.epi.tutornow.tutorial.dto.ProposalResponse;
import co.edu.epi.tutornow.tutorial.dto.ResenaResponse;
import co.edu.epi.tutornow.tutorial.dto.TutorBriefResponse;
import co.edu.epi.tutornow.tutorial.dto.TutoringRequestResponse;
import co.edu.epi.tutornow.tutorial.dto.UserBriefResponse;
import co.edu.epi.tutornow.tutorial.model.Asesoria;
import co.edu.epi.tutornow.tutorial.model.EstadoAsesoria;
import co.edu.epi.tutornow.tutorial.model.Propuesta;
import co.edu.epi.tutornow.tutorial.model.Resena;
import co.edu.epi.tutornow.tutorial.model.SolicitudAsesoria;
import co.edu.epi.tutornow.tutors.model.Tutor;
import co.edu.epi.tutornow.users.model.Usuario;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TutorialMapper {

    public TutoringRequestResponse toSolicitudResponse(
            Usuario viewer,
            SolicitudAsesoria solicitud,
            long propuestasCount,
            List<ProposalResponse> propuestas,
            Boolean isProfileMatch,
            AsesoriaResponse asesoria) {
        return TutoringRequestResponse.builder()
                .id(solicitud.getId())
                .tema(solicitud.getTema())
                .modalidad(solicitud.getModalidad().name())
                .disponibilidad(solicitud.getDisponibilidad())
                .descripcion(solicitud.getDescripcion())
                .estado(solicitud.getEstado().name())
                .materia(CatalogItemResponse.builder()
                        .id(solicitud.getMateria().getId())
                        .label(solicitud.getMateria().getNombre())
                        .build())
                .estudiante(UserBriefResponse.builder()
                        .id(solicitud.getEstudiante().getId())
                        .fullName(solicitud.getEstudiante().getNombreCompleto())
                        .build())
                .propuestasCount(propuestasCount)
                .isOwner(solicitud.getEstudiante().getId().equals(viewer.getId()))
                .isProfileMatch(isProfileMatch)
                .propuestas(propuestas)
                .asesoria(asesoria)
                .createdAt(solicitud.getCreatedAt())
                .build();
    }

    public AsesoriaResponse toAsesoriaResponse(Asesoria asesoria, Usuario viewer) {
        List<Resena> resenas = asesoria.getResenas() == null ? List.of() : asesoria.getResenas();
        Resena miResena = viewer == null
                ? null
                : resenas.stream()
                        .filter(r -> r.getAutor() != null && r.getAutor().getId().equals(viewer.getId()))
                        .findFirst()
                        .orElse(null);
        boolean completa = asesoria.getEstado() == EstadoAsesoria.EVALUADA || resenas.size() >= 2;
        Resena resenaContraparte = completa
                ? resenas.stream()
                        .filter(r -> viewer == null
                                || r.getAutor() == null
                                || !r.getAutor().getId().equals(viewer.getId()))
                        .findFirst()
                        .orElse(null)
                : null;

        String estadoEvaluacion;
        if (completa) {
            estadoEvaluacion = "COMPLETA";
        } else if (miResena != null) {
            estadoEvaluacion = "ESPERANDO_CONTRAPARTE";
        } else {
            estadoEvaluacion = "PENDIENTE";
        }

        return AsesoriaResponse.builder()
                .id(asesoria.getId())
                .solicitudId(asesoria.getSolicitud().getId())
                .propuestaId(asesoria.getPropuesta().getId())
                .estado(asesoria.getEstado().name())
                .tutor(toTutorBrief(asesoria.getTutor()))
                .confirmadaEstudiante(asesoria.getConfirmacionEstudianteAt() != null)
                .confirmadaTutor(asesoria.getConfirmacionTutorAt() != null)
                .finalizadaAt(asesoria.getFinalizadaAt())
                .estadoEvaluacion(estadoEvaluacion)
                .miResena(miResena == null ? null : toResenaResponse(miResena))
                .resenaContraparte(resenaContraparte == null ? null : toResenaResponse(resenaContraparte))
                .createdAt(asesoria.getCreatedAt())
                .build();
    }

    private ResenaResponse toResenaResponse(Resena resena) {
        return ResenaResponse.builder()
                .id(resena.getId())
                .rolAutor(resena.getRolAutor().name())
                .rating(resena.getRating())
                .comentario(resena.getComentario())
                .createdAt(resena.getCreatedAt())
                .build();
    }

    public ProposalResponse toProposalResponse(Propuesta propuesta, boolean isMine) {
        return ProposalResponse.builder()
                .id(propuesta.getId())
                .solicitudId(propuesta.getSolicitud().getId())
                .mensaje(propuesta.getMensaje())
                .estado(propuesta.getEstado().name())
                .tutor(toTutorBrief(propuesta.getTutor()))
                .isMine(isMine)
                .createdAt(propuesta.getCreatedAt())
                .build();
    }

    public TutorBriefResponse toTutorBrief(Tutor tutor) {
        List<CatalogItemResponse> materias = tutor.getMaterias().stream()
                .map(m -> CatalogItemResponse.builder()
                        .id(m.getId())
                        .label(m.getNombre())
                        .build())
                .toList();
        return TutorBriefResponse.builder()
                .id(tutor.getId())
                .fullName(tutor.getUsuario().getNombreCompleto())
                .biografia(tutor.getBiografia())
                .materias(materias)
                .build();
    }
}
