package co.edu.epi.tutornow.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmisorBriefResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("fullName")
    private String fullName;
}
