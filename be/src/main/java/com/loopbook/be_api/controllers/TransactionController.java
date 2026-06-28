package com.loopbook.be_api.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.entities.Book;
import com.loopbook.be_api.entities.Transaction;
import com.loopbook.be_api.entities.User;
import com.loopbook.be_api.repositories.UserRepository;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.BookService;
import com.loopbook.be_api.services.TransactionService;
import com.loopbook.be_api.services.WalletService;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TransactionController {

    private final TransactionService transactionService;
    private final BookService bookService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public TransactionController(TransactionService transactionService, BookService bookService,
                                 WalletService walletService, JwtUtils jwtUtils, UserRepository userRepository) {
        this.transactionService = transactionService;
        this.bookService = bookService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(
            @RequestBody Transaction transaction,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);

            // Lấy thông tin book để kiểm tra seller
            String bookId = transaction.getBookId();
            if (bookId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin sách"));
            }

            Book book = bookService.getBookEntityById(bookId);
            if (book == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy sách"));
            }

            // Không thể mua tài liệu của chính mình
            if (book.getSellerId() != null && userId.equals(book.getSellerId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Bạn không thể mua tài liệu của chính mình"));
            }

            // Lấy thông tin người bán
            User seller = book.getSellerId() != null
                    ? userRepository.findById(book.getSellerId()).orElse(null)
                    : null;

            // Fill required fields
            transaction.setBuyerId(userId);
            transaction.setSellerId(book.getSellerId());
            transaction.setStatus("pending");
            transaction.setWhenTime(LocalDateTime.now().toString());
            transaction.setBook(book.getTitle() != null ? book.getTitle() : "");
            transaction.setPartner(seller != null ? seller.getName() : "");

            Transaction saved = transactionService.create(transaction);

            // Nếu thanh toán bằng ví, xử lý chuyển tiền
            if ("wallet".equals(transaction.getPaymentMethod())) {
                try {
                    saved = transactionService.processWalletPayment(saved);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Thanh toán ví thất bại: " + e.getMessage()));
                }
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserTransactions(
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            List<Transaction> asBuyer = transactionService.getByBuyerId(userId);
            List<Transaction> asSeller = transactionService.getBySellerId(userId);
            // Merge: as buyer first, then as seller (avoid duplicates by id)
            for (Transaction t : asSeller) {
                if (asBuyer.stream().noneMatch(e -> e.getId().equals(t.getId()))) {
                    asBuyer.add(t);
                }
            }
            return ResponseEntity.ok(asBuyer);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionById(@PathVariable String id) {
        try {
            Transaction transaction = transactionService.getById(id);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterTransactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        return ResponseEntity.ok(
                transactionService.filter(status, type));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(
            @PathVariable String id) {

        return ResponseEntity.ok(
                transactionService
                        .confirmTransaction(id));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<?> refund(
            @PathVariable String id,
            @RequestHeader("Authorization")
            String authHeader) {

        try {

            jwtUtils.extractUserIdFromToken(
                    authHeader);

            return ResponseEntity.ok(
                    transactionService
                            .refundTransaction(id));

        } catch (Exception e) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()));
        }
    }

    // Create deposit request
    @PostMapping("/topup")
    public ResponseEntity<?> createTopup(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization")
            String authHeader) {

        try {

            UUID userId =
                    jwtUtils.extractUserIdFromToken(
                            authHeader);

            Integer amount =
                    ((Number) body.get("amount"))
                            .intValue();

            String paymentMethod =
                    (String) body.get(
                            "paymentMethod");

            return ResponseEntity.ok(
                    transactionService
                            .createTopupRequest(
                                    userId,
                                    amount,
                                    paymentMethod));

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()));
        }
    }

    // Admin review deposit request
    @GetMapping("/topup/pending")
    public ResponseEntity<?> getPendingTopups() {

        return ResponseEntity.ok(
                transactionService
                        .getPendingTopups());
    }

    // Admin approve deposit request
    @PostMapping("/topup/{id}/approve")
    public ResponseEntity<?> approveTopup(
            @PathVariable String id) {

        return ResponseEntity.ok(
                transactionService
                        .approveTopup(id));
    }

    // Admin reject deposit request
    @PostMapping("/topup/{id}/reject")
    public ResponseEntity<?> rejectTopup(
            @PathVariable String id) {

        return ResponseEntity.ok(
                transactionService
                        .rejectTopup(id));
    }

    // History deposit request
    @GetMapping("/topup/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader("Authorization")
            String authHeader) {

        UUID userId =
                jwtUtils.extractUserIdFromToken(
                        authHeader);

        return ResponseEntity.ok(
                transactionService
                        .getTopupHistory(
                                userId));
    }

    // Buy subscriptions
    @PostMapping("/package")
    public ResponseEntity<?> purchasePackage(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization")
            String authHeader) {

        try {

            UUID userId =
                    jwtUtils.extractUserIdFromToken(
                            authHeader);

            String packageName =
                    (String) body.get(
                            "packageName");

            String planId =
                    (String) body.get(
                            "planId");

            Integer amount =
                    ((Number) body.get(
                            "amount"))
                            .intValue();

            return ResponseEntity.ok(
                    transactionService
                            .purchasePackage(
                                    userId,
                                    packageName,
                                    planId,
                                    amount));

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()));
        }
    }
    // Export report
    @GetMapping("/admin/report")
    public ResponseEntity<?> exportReport() {

        return ResponseEntity.ok(
                transactionService
                        .getAllTransactions());
    }
}
