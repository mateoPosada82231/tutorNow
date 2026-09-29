package co.edu.epi.tutornow.tutors.repository;

import co.edu.epi.tutornow.tutors.model.TutorSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutorSlotRepository extends JpaRepository<TutorSlot, Long> {

    List<TutorSlot> findByTutorId(Long tutorId);

    void deleteByTutorId(Long tutorId);
}
