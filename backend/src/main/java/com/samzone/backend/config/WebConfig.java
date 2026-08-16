package com.samzone.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AdminWriteAccessInterceptor adminWriteAccessInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminWriteAccessInterceptor)
                .addPathPatterns(
                        "/api/admin/**",
                        "/api/products/seed",
                        "/api/products/refresh-images");
    }
}
