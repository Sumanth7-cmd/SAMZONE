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

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        return ResponseEntity.ok(chatService.chat(message));
    }
}
