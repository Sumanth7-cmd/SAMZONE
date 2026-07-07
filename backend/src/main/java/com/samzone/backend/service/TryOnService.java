package com.samzone.backend.service;

import com.samzone.backend.dto.TryOnResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

// Renders the user actually wearing the selected garment via Gemini's image
// editing (gemini-2.0-flash-exp), instead of the client-side canvas overlay
// in FixedWebcamTryOn.tsx. That overlay stays as the fallback path: it's what
// the frontend switches to when this returns fallback=true (no key, quota
// exhausted, model unavailable, or Gemini simply didn't return an image).
@Service
public class TryOnService {

    private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024;
    private static final int TIMEOUT_MS = 60_000;
    private static final String MODEL_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;

    public TryOnService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_MS);
        factory.setReadTimeout(TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    public TryOnResponse generateTryOn(String userPhotoRaw, String productImageUrl, String productName) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return TryOnResponse.fallback("AI try-on is not configured on this server.");
        }

        String userPhotoBase64 = stripDataUrlPrefix(userPhotoRaw);
        byte[] decodedPhoto;
        try {
            decodedPhoto = Base64.getDecoder().decode(userPhotoBase64);
        } catch (IllegalArgumentException e) {
            return TryOnResponse.error("Invalid photo data.");
        }
        if (decodedPhoto.length > MAX_PHOTO_BYTES) {
            return TryOnResponse.error("Photo is too large (max 2MB). Please use a smaller image.");
        }

        String productImageBase64;
        try {
            byte[] productBytes = restTemplate.getForObject(productImageUrl, byte[].class);
            if (productBytes == null || productBytes.length == 0) {
                throw new IllegalStateException("empty product image");
            }
            productImageBase64 = Base64.getEncoder().encodeToString(productBytes);
        } catch (Exception e) {
            return TryOnResponse.fallback("Could not load the product image: " + e.getMessage());
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(
                            Map.of("inlineData", Map.of("mimeType", "image/jpeg", "data", userPhotoBase64)),
                            Map.of("inlineData", Map.of("mimeType", "image/jpeg", "data", productImageBase64)),
                            Map.of("text", "Edit the first image so the person is wearing the garment shown in "
                                    + "the second image (" + productName + "). Keep the person's face, pose and "
                                    + "background identical. Only change their clothing to match the garment. "
                                    + "Return the edited image.")
                    ))),
                    "generationConfig", Map.of("responseModalities", List.of("IMAGE", "TEXT")));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(MODEL_URL, HttpMethod.POST, entity, Map.class);
            String resultImage = extractInlineImage(response.getBody());
            if (resultImage == null) {
                return TryOnResponse.fallback("Gemini did not return an image for this try-on.");
            }
            return TryOnResponse.success(resultImage);
        } catch (Exception e) {
            return TryOnResponse.fallback("AI try-on failed: " + e.getMessage());
        }
    }

    private String stripDataUrlPrefix(String raw) {
        if (raw == null) {
            return "";
        }
        int commaIndex = raw.indexOf(',');
        return raw.startsWith("data:") && commaIndex != -1 ? raw.substring(commaIndex + 1) : raw;
    }

    @SuppressWarnings("unchecked")
    private String extractInlineImage(Map<String, Object> body) {
        if (body == null) {
            return null;
        }
        List<Object> candidates = (List<Object>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Map<String, Object> candidate = (Map<String, Object>) candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) candidate.get("content");
        if (content == null) {
            return null;
        }
        List<Object> parts = (List<Object>) content.get("parts");
        if (parts == null) {
            return null;
        }
        for (Object partObj : parts) {
            Map<String, Object> part = (Map<String, Object>) partObj;
            Map<String, Object> inlineData = (Map<String, Object>) part.get("inlineData");
            if (inlineData != null && inlineData.get("data") != null) {
                return (String) inlineData.get("data");
            }
        }
        return null;
    }
}
