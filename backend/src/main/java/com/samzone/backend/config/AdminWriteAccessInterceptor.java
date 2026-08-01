package com.samzone.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Administrative maintenance routes mutate catalog data and must never be
 * exposed publicly. The token is intentionally server-only: no browser code
 * reads or ships it. An unset token denies writes, which is the safe default.
 */
@Component
public class AdminWriteAccessInterceptor implements HandlerInterceptor {

    private static final String ADMIN_TOKEN_HEADER = "X-Admin-Token";

    private final String adminApiKey;

    public AdminWriteAccessInterceptor(@Value("${samzone.admin.api-key:}") String adminApiKey) {
        this.adminApiKey = adminApiKey;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String suppliedToken = request.getHeader(ADMIN_TOKEN_HEADER);
        boolean authorized = !adminApiKey.isBlank()
                && suppliedToken != null
                && MessageDigest.isEqual(
                    adminApiKey.getBytes(StandardCharsets.UTF_8),
                    suppliedToken.getBytes(StandardCharsets.UTF_8));
        if (authorized) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        return false;
    }
}
