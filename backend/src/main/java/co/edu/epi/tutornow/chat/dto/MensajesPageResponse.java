package co.edu.epi.tutornow.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajesPageResponse {

    @JsonProperty("data")
    private List<MensajeResponse> data;

    @JsonProperty("pagination")
    private Pagination pagination;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Pagination {

        @JsonProperty("size")
        private int size;

        @JsonProperty("hasMore")
        private boolean hasMore;

        @JsonProperty("nextBefore")
        private Long nextBefore;
    }
}
