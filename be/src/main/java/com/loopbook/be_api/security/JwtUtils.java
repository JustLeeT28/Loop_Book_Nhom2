package com.loopbook.be_api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtUtils {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public UUID extractUserIdFromToken(String token) {
        try {
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String[] parts = cleanToken.split("\\.");
            
            if (parts.length != 3) {
                throw new RuntimeException("Invalid JWT format");
            }
            
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> claims = objectMapper.readValue(payload, Map.class);
            
            String sub = (String) claims.get("sub");
            if (sub == null) {
                throw new RuntimeException("No 'sub' claim in token");
            }
            
            return UUID.fromString(sub);
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWT token: " + e.getMessage(), e);
        }
    }
    
    public boolean validateToken(String token) {
        try {
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String[] parts = cleanToken.split("\\.");
            
            if (parts.length != 3) {
                return false;
            }
            
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            Map<String, Object> claims = objectMapper.readValue(payload, Map.class);
            
            return claims.containsKey("sub");
        } catch (Exception e) {
            return false;
        }
    }
}
