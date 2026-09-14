package co.edu.epi.tutornow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TutorNowApplicationTests {

    @Test
    @DisplayName("El contexto de Spring arranca correctamente")
    void contextLoads() {
    }
}
