package co.edu.epi.tutornow.chat.repository;

import co.edu.epi.tutornow.chat.model.ChatLectura;
import co.edu.epi.tutornow.chat.model.ChatLecturaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatLecturaRepository extends JpaRepository<ChatLectura, ChatLecturaId> {
}
