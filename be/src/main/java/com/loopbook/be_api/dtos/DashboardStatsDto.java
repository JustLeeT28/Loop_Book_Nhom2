package com.loopbook.be_api.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    private Long totalUsers;

    private Long totalBooks;

    private Long pendingBooks;

    private Long totalTransactions;

    private Long completedTransactions;

    private Long totalCategories;
}