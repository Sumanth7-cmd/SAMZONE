package com.samzone.backend.controller;

import com.samzone.backend.dto.ChatResponse;
import com.samzone.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final int MAX_MESSAGE_LENGTH = 2_000;

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message != null && message.length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(chatService.chat(message));
    }
}
