package com.loopbook.be_api.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Complaint;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findByComplainantIdOrderByCreatedAtDesc(UUID complainantId);

    List<Complaint> findByDefendantIdOrderByCreatedAtDesc(UUID defendantId);

    List<Complaint> findByTransactionId(String transactionId);

    List<Complaint> findByStatusOrderByCreatedAtDesc(String status);

    List<Complaint> findAllByOrderByCreatedAtDesc();
}