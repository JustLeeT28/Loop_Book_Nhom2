package com.loopbook.be_api.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.dtos.ComplaintResponse;
import com.loopbook.be_api.entities.Complaint;
import com.loopbook.be_api.entities.Transaction;
import com.loopbook.be_api.repositories.ComplaintRepository;
import com.loopbook.be_api.repositories.TransactionRepository;
import com.loopbook.be_api.repositories.UserRepository;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final TransactionService transactionService;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            TransactionRepository transactionRepository,
                            WalletService walletService,
                            TransactionService transactionService,
                            UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    /**
     * Tạo khiếu nại mới.
     */
    @Transactional
    public ComplaintResponse createComplaint(UUID complainantId, Map<String, Object> body) {
        String transactionId = (String) body.get("transactionId");
        String description = (String) body.getOrDefault("description", "");

        Complaint complaint = new Complaint();
        complaint.setComplainantId(complainantId);
        complaint.setTransactionId(transactionId);
        complaint.setDescription(description);
        complaint.setType("dispute");
        complaint.setStatus("pending");
        complaint.setEvidenceUrls("[]");

        if (transactionId != null) {
            Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
            if (transaction != null) {
                complaint.setDefendantId(transaction.getSellerId());
                complaint.setBookId(transaction.getBookId());
                complaint.setTitle("Khiếu nại giao dịch: " + transaction.getBook());
            } else {
                complaint.setTitle("Khiếu nại giao dịch #" + transactionId);
            }
        } else {
            complaint.setTitle((String) body.getOrDefault("title", "Khiếu nại"));
        }

        return toResponse(complaintRepository.save(complaint));
    }

    public List<ComplaintResponse> getMyComplaints(UUID userId) {
        List<Complaint> complaints = complaintRepository.findByComplainantIdOrderByCreatedAtDesc(userId);
        return complaints.stream().map(this::toResponse).toList();
    }

    public List<ComplaintResponse> getComplaintsAgainstMe(UUID userId) {
        List<Complaint> complaints = complaintRepository.findByDefendantIdOrderByCreatedAtDesc(userId);
        return complaints.stream().map(this::toResponse).toList();
    }

    public List<ComplaintResponse> getAllComplaints() {
        List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        return complaints.stream().map(this::toResponse).toList();
    }

    public ComplaintResponse getById(UUID id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        return toResponse(complaint);
    }

    public Complaint getComplaintEntity(UUID id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
    }

    /**
     * Convert Complaint entity to ComplaintResponse DTO, looking up user names.
     */
    private ComplaintResponse toResponse(Complaint c) {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(c.getId());
        r.setComplainantId(c.getComplainantId());
        r.setDefendantId(c.getDefendantId());
        r.setTransactionId(c.getTransactionId());
        r.setBookId(c.getBookId());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setEvidenceUrls(c.getEvidenceUrls());
        r.setType(c.getType());
        r.setStatus(c.getStatus());
        r.setResolutionNote(c.getResolutionNote());
        r.setResolvedBy(c.getResolvedBy());
        r.setResolvedAt(c.getResolvedAt());
        r.setBookReturned(c.getBookReturned());
        r.setBookReturnedAt(c.getBookReturnedAt());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());

        // Lookup complainant name
        if (c.getComplainantId() != null) {
            userRepository.findById(c.getComplainantId())
                    .ifPresent(u -> r.setComplainantName(u.getName()));
        }
        // Lookup defendant name
        if (c.getDefendantId() != null) {
            userRepository.findById(c.getDefendantId())
                    .ifPresent(u -> r.setDefendantName(u.getName()));
        }
        return r;
    }

    /**
     * Bước 1 – Admin giải quyết khiếu nại.
     * Chỉ set trạng thái, KHÔNG hoàn tiền.
     * Status hợp lệ: resolved_buyer, resolved_seller, dismissed.
     *
     * Nếu resolved_buyer → chờ người bán xác nhận đã nhận sách (bước 2).
     */
    @Transactional
    public ComplaintResponse resolveComplaint(UUID complaintId, UUID adminId, String status, String resolutionNote) {
        Complaint complaint = getComplaintEntity(complaintId);

        if (!List.of("pending", "open").contains(complaint.getStatus())) {
            throw new RuntimeException("Khiếu nại đã được xử lý trước đó");
        }

        if (!List.of("resolved_buyer", "resolved_seller", "dismissed").contains(status)) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }

        complaint.setStatus(status);
        complaint.setResolutionNote(resolutionNote);
        complaint.setResolvedBy(adminId);
        complaint.setResolvedAt(LocalDateTime.now());
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    /**
     * Bước 2 – Người bán xác nhận đã nhận lại sách.
     * Chỉ áp dụng cho khiếu nại có status = resolved_buyer và chưa bookReturned.
     * Thực hiện refund người mua.
     */
    @Transactional
    public ComplaintResponse confirmBookReturned(UUID complaintId, UUID sellerId) {
        Complaint complaint = getComplaintEntity(complaintId);

        if (!"resolved_buyer".equals(complaint.getStatus())) {
            throw new RuntimeException("Khiếu nại này không ở trạng thái resolved_buyer, không thể xác nhận trả sách");
        }

        if (Boolean.TRUE.equals(complaint.getBookReturned())) {
            throw new RuntimeException("Người bán đã xác nhận trả sách trước đó");
        }

        // Kiểm tra người xác nhận có đúng là defendant của complaint không
        if (!complaint.getDefendantId().equals(sellerId)) {
            throw new RuntimeException("Bạn không phải là người bị khiếu nại trong vụ này");
        }

        // Kiểm tra giao dịch trước
        String transactionId = complaint.getTransactionId();
        if (transactionId == null) {
            throw new RuntimeException("Không tìm thấy giao dịch liên quan để hoàn tiền");
        }

        // Thực hiện refund người mua
        transactionService.refundTransaction(transactionId);

        // Cập nhật trạng thái: resolved_buyer → resolved (đã hoàn tất)
        complaint.setStatus("resolved");
        complaint.setBookReturned(true);
        complaint.setBookReturnedAt(LocalDateTime.now());
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }
}