package co.edu.epi.tutornow.tutorial.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBriefResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("fullName")
    private String fullName;
}
