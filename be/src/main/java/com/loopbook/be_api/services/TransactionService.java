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

    public TransactionService(TransactionRepository transactionRepository, WalletService walletService, BookRepository bookRepository) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Transaction create(Transaction transaction) {
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID().toString());
        }
        return transactionRepository.save(transaction);
    }

    /**
     * Xử lý chuyển tiền từ ví người mua sang ví người bán nếu phương thức thanh toán là "wallet".
     * Trừ tiền người mua, cộng tiền vào ví người bán, cập nhật trạng thái giao dịch.
     */
    @Transactional
    public Transaction processWalletPayment(Transaction transaction) {
        if (!"wallet".equals(transaction.getPaymentMethod())) {
            return transaction;
        }

        int amount = Integer.parseInt(transaction.getAmount());

        // 1. Trừ tiền từ ví người mua
        walletService.deduct(transaction.getBuyerId(), amount);

        // 2. Tính netAmount (tạm thời chưa tính phí, fee = 0)
        int netAmount = amount;

        // 3. Cộng tiền vào ví người bán
        walletService.topUp(transaction.getSellerId(), netAmount);

        // 4. Cập nhật trạng thái transaction
        transaction.setStatus("completed");
        transaction.setIsCompleted(true);
        transaction.setCompletedAt(LocalDateTime.now());
        transaction.setNetAmount(netAmount);
        transaction.setFeeAmount(0);

        Transaction saved = transactionRepository.save(transaction);

        // 5. Đánh dấu sách đã bán để ẩn khỏi danh sách công khai
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
            // Logger would be better here
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
}