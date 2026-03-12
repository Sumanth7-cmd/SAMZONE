package com.samzone.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<String> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        
        if (openaiApiKey == null || openaiApiKey.isEmpty() || "default".equals(openaiApiKey)) {
            return ResponseEntity.ok(getFallbackResponse(message));
        }

        try {
            // Create OpenAI API request
            String url = "https://api.openai.com/v1/chat/completions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openaiApiKey);

            // Build the request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", getSystemPrompt()),
                Map.of("role", "user", "content", message)
            ));
            requestBody.put("max_tokens", 150);
            requestBody.put("temperature", 0.7);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Call OpenAI API
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            
            if (response != null && response.containsKey("choices")) {
                Object[] choices = (Object[]) response.get("choices");
                if (choices.length > 0) {
                    Map<String, Object> choice = (Map<String, Object>) choices[0];
                    Map<String, Object> messageMap = (Map<String, Object>) choice.get("message");
                    String aiResponse = (String) messageMap.get("content");
                    return ResponseEntity.ok(aiResponse);
                }
            }
            
            return ResponseEntity.ok(getFallbackResponse(message));
            
        } catch (Exception e) {
            System.err.println("OpenAI API error: " + e.getMessage());
            return ResponseEntity.ok(getFallbackResponse(message));
        }
    }

    private String getSystemPrompt() {
        return "You are S.A.M., a friendly and professional shopping assistant for SAMZONE e-commerce platform. " +
               "You help users find products, suggest outfits, and provide style advice. " +
               "Always be helpful, conversational, and limit product suggestions to 3 items maximum. " +
               "When users ask about clothing matching, suggest complementary items based on color and style. " +
               "Be enthusiastic but professional. Use emojis occasionally to be friendly.";
    }

    private String getFallbackResponse(String message) {
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("hi") || lowerMessage.contains("hello")) {
            return "Hey there! 👋 I'm S.A.M., your personal style assistant. What outfit are you looking for today?";
        } else if (lowerMessage.contains("shirt")) {
            return "I'd be happy to help you find the perfect shirt! We have a great selection of casual and formal options. What style interests you most?";
        } else if (lowerMessage.contains("jean")) {
            return "Jeans are a wardrobe essential! I can help you find the perfect fit and style. Are you looking for slim, regular, or relaxed fit?";
        } else if (lowerMessage.contains("what goes with") && lowerMessage.contains("black jeans")) {
            return "Black jeans are incredibly versatile! I'd suggest pairing them with: 1) A crisp white shirt for a classic look, 2) A denim jacket for double denim style, or 3) White sneakers for a clean, casual vibe. What's your preference? 👕";
        } else if (lowerMessage.contains("recommend") || lowerMessage.contains("suggest")) {
            return "I'd love to suggest some great options for you! Could you tell me more about what you're looking for?";
        } else {
            return "I'm here to help with your shopping needs! Feel free to ask me about products, styles, or outfit recommendations. 🛍️";
        }
    }
}
