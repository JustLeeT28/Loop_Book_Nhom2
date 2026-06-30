package com.loopbook.be_api.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.dtos.ComplaintResponse;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.ComplaintService;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ComplaintController {

    private final ComplaintService complaintService;
    private final JwtUtils jwtUtils;

    public ComplaintController(ComplaintService complaintService, JwtUtils jwtUtils) {
        this.complaintService = complaintService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * POST /api/complaints - Tạo khiếu nại mới
     */
    @PostMapping
    public ResponseEntity<?> createComplaint(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            ComplaintResponse complaint = complaintService.createComplaint(userId, body);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/complaints/my - Danh sách khiếu nại của tôi
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyComplaints(
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            List<ComplaintResponse> complaints = complaintService.getMyComplaints(userId);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/complaints/against-me - Khiếu nại chống lại tôi
     */
    @GetMapping("/against-me")
    public ResponseEntity<?> getComplaintsAgainstMe(
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            List<ComplaintResponse> complaints = complaintService.getComplaintsAgainstMe(userId);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/complaints - Admin: tất cả khiếu nại
     */
    @GetMapping
    public ResponseEntity<?> getAllComplaints() {
        try {
            List<ComplaintResponse> complaints = complaintService.getAllComplaints();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/complaints/{id} - Chi tiết khiếu nại
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable UUID id) {
        try {
            ComplaintResponse complaint = complaintService.getById(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/complaints/{id}/resolve - Admin giải quyết khiếu nại
     * Body: { "status": "resolved_buyer" | "resolved_seller" | "dismissed", "resolutionNote": "..." }
     *
     * Bước 1: chỉ set status, KHÔNG hoàn tiền.
     * Nếu resolved_buyer → người bán cần xác nhận đã nhận sách (PUT /{id}/confirm-return).
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveComplaint(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID adminId = jwtUtils.extractUserIdFromToken(authHeader);
            String status = (String) body.get("status");
            String resolutionNote = (String) body.getOrDefault("resolutionNote", "");

            ComplaintResponse complaint = complaintService.resolveComplaint(id, adminId, status, resolutionNote);
            return ResponseEntity.ok(complaint);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/complaints/{id}/confirm-return - Người bán xác nhận đã nhận lại sách → kích hoạt refund
     *
     * Bước 2: chỉ người bán (defendant) mới được gọi.
     */
    @PutMapping("/{id}/confirm-return")
    public ResponseEntity<?> confirmBookReturned(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID sellerId = jwtUtils.extractUserIdFromToken(authHeader);
            ComplaintResponse complaint = complaintService.confirmBookReturned(id, sellerId);
            return ResponseEntity.ok(complaint);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}