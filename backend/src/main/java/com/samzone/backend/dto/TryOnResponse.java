package com.samzone.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TryOnResponse {
    private boolean success;
    private String resultImage;
    private boolean fallback;
    private String message;

    public static TryOnResponse success(String resultImage) {
        TryOnResponse r = new TryOnResponse();
        r.success = true;
        r.resultImage = resultImage;
        return r;
    }

    public static TryOnResponse fallback(String message) {
        TryOnResponse r = new TryOnResponse();
        r.success = false;
        r.fallback = true;
        r.message = message;
        return r;
    }

    public static TryOnResponse error(String message) {
        TryOnResponse r = new TryOnResponse();
        r.success = false;
        r.fallback = false;
        r.message = message;
        return r;
    }
}
