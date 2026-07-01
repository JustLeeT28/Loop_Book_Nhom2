package com.loopbook.be_api.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.entities.Book;
import com.loopbook.be_api.entities.Transaction;
import com.loopbook.be_api.repositories.BookRepository;
import com.loopbook.be_api.repositories.TransactionRepository;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final BookRepository bookRepository;
    private final PremiumPlanService premiumPlanService;

    public TransactionService(TransactionRepository transactionRepository, WalletService walletService, BookRepository bookRepository, PremiumPlanService premiumPlanService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.bookRepository = bookRepository;
        this.premiumPlanService = premiumPlanService;
    }

    @Transactional
    public Transaction create(Transaction transaction) {
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID().toString());
        }
        return transactionRepository.save(transaction);
    }

    /**
     * Xử lý thanh toán bằng ví: Giữ tiền trong hệ thống (escrow) thay vì chuyển ngay cho người bán.
     * Tiền sẽ được giữ ở held_balance của người mua và chỉ chuyển cho người bán
     * khi người mua xác nhận đã nhận được sách.
     */
    @Transactional
    public Transaction processWalletPayment(Transaction transaction) {
        if (!"wallet".equals(transaction.getPaymentMethod())) {
            return transaction;
        }

        int amount = Integer.parseInt(transaction.getAmount());

        // 1. Giữ tiền từ ví người mua (trừ available balance, thêm vào held_balance)
        walletService.holdMoney(transaction.getBuyerId(), amount);

        // 2. Tính netAmount (tạm thời chưa tính phí, fee = 0)
        int netAmount = amount;

        // 3. Cập nhật trạng thái transaction -> "pending" (chờ người mua xác nhận)
        transaction.setStatus("pending");
        transaction.setIsCompleted(false);
        transaction.setNetAmount(netAmount);
        transaction.setFeeAmount(0);

        Transaction saved = transactionRepository.save(transaction);

        // 4. Đánh dấu sách đã bán để ẩn khỏi danh sách công khai
        try {
            Book book = bookRepository.findById(transaction.getBookId()).orElse(null);
            if (book != null) {
                book.setIsSold(true);
                book.setStatus("sold");
                book.setSoldAt(LocalDateTime.now());
                bookRepository.save(book);
            }
        } catch (Exception e) {
            // Không throw lỗi nếu không update được book (transaction vẫn thành công)
        }

        return saved;
    }

    public List<Transaction> getByBuyerId(UUID buyerId) {
        return transactionRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }

    public List<Transaction> getBySellerId(UUID sellerId) {
        return transactionRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    public List<Transaction> getByBookId(String bookId) {
        return transactionRepository.findByBookId(bookId);
    }

    public Transaction getById(String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + id));
    }

    @Transactional
    public Transaction updateStatus(String id, String status) {
        Transaction transaction = getById(id);
        transaction.setStatus(status);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction confirmTransaction(
            String id) {

        Transaction transaction = getById(id);

        // Chỉ cho phép xác nhận giao dịch đang ở trạng thái "pending" (đang giữ tiền)
        if (!"pending".equals(transaction.getStatus())) {
            throw new RuntimeException(
                    "Transaction can only be confirmed when status is 'pending'");
        }

        int netAmount = transaction.getNetAmount();

        // Giải phóng tiền từ held_balance của người mua sang available balance của người bán
        walletService.releaseHeldMoneyToSeller(
                transaction.getSellerId(),
                netAmount);

        // Giảm held_balance của người mua (tiền đã chuyển cho người bán)
        walletService.releaseHeldMoneyToBuyer(
                transaction.getBuyerId(),
                netAmount);

        transaction.setStatus("completed");
        transaction.setIsCompleted(true);
        transaction.setCompletedAt(
                LocalDateTime.now());

        return transactionRepository.save(
                transaction);
    }

    public List<Transaction> filter(
            String status,
            String type) {

        if (status != null && type != null) {
            return transactionRepository
                    .findByStatusAndType(status, type);
        }

        if (status != null) {
            return transactionRepository
                    .findByStatus(status);
        }

        if (type != null) {
            return transactionRepository
                    .findByType(type);
        }

        return transactionRepository.findAll();
    }

    @Transactional
    public Transaction refundTransaction(String id) {

        Transaction transaction = getById(id);

        if ("refunded".equals(transaction.getStatus())) {
            throw new RuntimeException(
                    "Transaction already refunded");
        }

        int amount = transaction.getNetAmount();

        if ("pending".equals(transaction.getStatus())) {
            // Giao dịch đang ở trạng thái chờ xác nhận - tiền đang ở held_balance của người mua
            // Hoàn lại held_balance về available balance cho người mua
            walletService.releaseHeldMoneyToBuyer(
                    transaction.getBuyerId(),
                    amount);

            // Đánh dấu lại sách là chưa bán
            try {
                Book book = bookRepository.findById(transaction.getBookId()).orElse(null);
                if (book != null) {
                    book.setIsSold(false);
                    book.setStatus("active");
                    book.setSoldAt(null);
                    bookRepository.save(book);
                }
            } catch (Exception e) {
                // Không throw lỗi
            }
        } else if (Boolean.TRUE.equals(transaction.getIsCompleted())) {
            // Giao dịch đã hoàn tất - tiền đã ở ví người bán
            // trừ tiền người bán
            walletService.deduct(
                    transaction.getSellerId(),
                    amount);

            // hoàn tiền người mua
            walletService.topUp(
                    transaction.getBuyerId(),
                    amount);

            // Đánh dấu lại sách là chưa bán
            try {
                Book book = bookRepository.findById(transaction.getBookId()).orElse(null);
                if (book != null) {
                    book.setIsSold(false);
                    book.setStatus("active");
                    book.setSoldAt(null);
                    bookRepository.save(book);
                }
            } catch (Exception e) {
                // Không throw lỗi
            }
        } else {
            throw new RuntimeException(
                    "Transaction cannot be refunded in current status: " + transaction.getStatus());
        }

        transaction.setStatus("refunded");

        return transactionRepository
                .save(transaction);
    }

    public List<Transaction>
    getTopupHistory(
            UUID userId) {

        return transactionRepository
                .findByBuyerIdAndTypeOrderByCreatedAtDesc(
                        userId,
                        "topup");
    }

    // Create a deposit request
    @Transactional
    public Transaction createTopupRequest(
            UUID userId,
            Integer amount,
            String paymentMethod) {

        Transaction transaction =
                new Transaction();

        transaction.setId(
                UUID.randomUUID().toString());

        transaction.setBuyerId(userId);

        transaction.setType("topup");

        transaction.setStatus("pending");

        transaction.setAmount(
                String.valueOf(amount));

        transaction.setPaymentMethod(
                paymentMethod);

        transaction.setBook("Nạp tiền ví");

        transaction.setPartner("LoopBook");

        transaction.setWhenTime(
                LocalDateTime.now().toString());

        transaction.setIsCompleted(false);

        transaction.setNotes(
                "Yêu cầu nạp tiền");

        return transactionRepository.save(
                transaction);
    }

    public List<Transaction> getPendingTopups() {

        return transactionRepository
                .findByTypeAndStatus(
                        "topup",
                        "pending");
    }

    // Approve deposit request
    @Transactional
    public Transaction approveTopup(
            String transactionId) {

        Transaction transaction =
                getById(transactionId);

        if (!"topup".equals(
                transaction.getType())) {

            throw new RuntimeException(
                    "Invalid transaction type");
        }

        walletService.topUp(
                transaction.getBuyerId(),
                Integer.parseInt(
                        transaction.getAmount()));

        transaction.setStatus(
                "completed");

        transaction.setIsCompleted(
                true);

        transaction.setCompletedAt(
                LocalDateTime.now());

        return transactionRepository.save(
                transaction);
    }

    // Reject deposit request
    @Transactional
    public Transaction rejectTopup(
            String transactionId) {

        Transaction transaction =
                getById(transactionId);

        transaction.setStatus(
                "rejected");

        transaction.setIsCompleted(
                false);

        return transactionRepository.save(
                transaction);
    }
    // Buy subscriptions
    @Transactional
    public Transaction purchasePackage(
            UUID userId,
            String packageName,
            String planId,
            Integer amount) {

        // Deduct money from user's wallet
        walletService.deduct(
                userId,
                amount);

        Transaction transaction =
                new Transaction();

        transaction.setId(
                UUID.randomUUID().toString());

        transaction.setBuyerId(userId);

        transaction.setType("package");

        transaction.setBook(packageName);

        transaction.setPartner(
                "LoopBook");

        transaction.setAmount(
                String.valueOf(amount));

        transaction.setStatus(
                "completed");

        transaction.setIsCompleted(
                true);

        transaction.setCompletedAt(
                LocalDateTime.now());

        transaction.setWhenTime(
                LocalDateTime.now()
                        .toString());

        transaction.setNotes(
                "Mua gói: " + packageName);

        return transactionRepository.save(
                transaction);
    }
    // Export report
    public List<Transaction>
    getAllTransactions() {

        return transactionRepository
                .findAll();
    }

}
