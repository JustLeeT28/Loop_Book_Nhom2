package com.loopbook.be_api.services;

import com.loopbook.be_api.dtos.DashboardStatsDto;
import com.loopbook.be_api.repositories.BookRepository;
import com.loopbook.be_api.repositories.CategoryRepository;
import com.loopbook.be_api.repositories.TransactionRepository;
import com.loopbook.be_api.repositories.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public DashboardService(
            UserRepository userRepository,
            BookRepository bookRepository,
            TransactionRepository transactionRepository,
            CategoryRepository categoryRepository) {

        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    public DashboardStatsDto getStats() {

        Long totalUsers = userRepository.count();

        Long totalBooks = bookRepository.count();

        Long pendingBooks =
                bookRepository.countByStatus("pending");

        Long totalTransactions =
                transactionRepository.count();

        Long completedTransactions =
                transactionRepository.countByStatus("completed");

        Long totalCategories =
                categoryRepository.count();

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalBooks(totalBooks)
                .pendingBooks(pendingBooks)
                .totalTransactions(totalTransactions)
                .completedTransactions(completedTransactions)
                .totalCategories(totalCategories)
                .build();
    }
}