package co.edu.epi.tutornow.catalog.controller;

import co.edu.epi.tutornow.catalog.dto.CatalogItemResponse;
import co.edu.epi.tutornow.catalog.repository.CarreraRepository;
import co.edu.epi.tutornow.catalog.repository.MateriaRepository;
import co.edu.epi.tutornow.catalog.repository.SemestreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalogs")
@RequiredArgsConstructor
public class CatalogController {

    private final CarreraRepository carreraRepository;
    private final SemestreRepository semestreRepository;
    private final MateriaRepository materiaRepository;

    @GetMapping("/carreras")
    public ResponseEntity<List<CatalogItemResponse>> getCarreras() {
        var carreras = carreraRepository.findByActivaTrueOrderByNombre()
                .stream()
                .map(c -> CatalogItemResponse.builder()
                        .id(c.getId())
                        .label(c.getNombre())
                        .build())
                .toList();
        return ResponseEntity.ok(carreras);
    }

    @GetMapping("/semestres")
    public ResponseEntity<List<CatalogItemResponse>> getSemestres() {
        var semestres = semestreRepository.findByActivoTrueOrderByNumero()
                .stream()
                .map(s -> CatalogItemResponse.builder()
                        .id(s.getId())
                        .label("Semestre " + s.getNumero())
                        .build())
                .toList();
        return ResponseEntity.ok(semestres);
    }

    @GetMapping("/materias")
    public ResponseEntity<List<CatalogItemResponse>> getMaterias() {
        var materias = materiaRepository.findByActivaTrueOrderByNombre()
                .stream()
                .map(m -> CatalogItemResponse.builder()
                        .id(m.getId())
                        .label(m.getNombre())
                        .build())
                .toList();
        return ResponseEntity.ok(materias);
    }
}
