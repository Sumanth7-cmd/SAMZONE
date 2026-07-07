package com.samzone.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TryOnRequest {
    private String userPhoto;
    private String productImage;
    private String productName;
}
