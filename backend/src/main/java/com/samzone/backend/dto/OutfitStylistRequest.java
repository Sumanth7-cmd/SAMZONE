package com.samzone.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OutfitStylistRequest {
    private String occasion;
    private String gender;
    private Double budget;
    private String preferredColor;
}
