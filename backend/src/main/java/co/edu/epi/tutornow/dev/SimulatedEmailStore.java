package co.edu.epi.tutornow.dev;

import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class SimulatedEmailStore {

    private static final int MAX_SIZE = 50;

    private final List<SimulatedEmail> emails = new ArrayList<>();

    public void add(String to, String subject, String content, String link, String kind) {
        synchronized (emails) {
            emails.add(0, new SimulatedEmail(to, subject, content, link, kind, OffsetDateTime.now()));
            while (emails.size() > MAX_SIZE) {
                emails.remove(emails.size() - 1);
            }
        }
    }

    public List<SimulatedEmail> findAll() {
        synchronized (emails) {
            return List.copyOf(emails);
        }
    }
}
