package co.edu.epi.tutornow.common.dto;

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
public class PageResponse<T> {

    @JsonProperty("data")
    private List<T> data;

    @JsonProperty("pagination")
    private PaginationInfo pagination;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationInfo {

        @JsonProperty("page")
        private int page;

        @JsonProperty("size")
        private int size;

        @JsonProperty("totalElements")
        private long totalElements;

        @JsonProperty("totalPages")
        private int totalPages;
    }
}
