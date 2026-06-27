package com.loopbook.be_api.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loopbook.be_api.dtos.CreateListingRequest;
import com.loopbook.be_api.dtos.ListingResponse;
import com.loopbook.be_api.dtos.UpdateListingRequest;
import com.loopbook.be_api.entities.Book;
import com.loopbook.be_api.entities.Transaction;
import com.loopbook.be_api.entities.User;
import com.loopbook.be_api.repositories.BookRepository;
import com.loopbook.be_api.repositories.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;
    
    public BookService(BookRepository bookRepository, UserRepository userRepository, WalletService walletService, TransactionService transactionService, ObjectMapper objectMapper) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.transactionService = transactionService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ListingResponse createListing(CreateListingRequest request, UUID sellerId) {
        String bookId = "bk_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);

        Book book = new Book();
        book.setId(bookId);
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setCategory(request.getCategory());
        book.setCondition(request.getCondition());
        book.setPrice(request.getPrice());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setEdition(request.getEdition());
        book.setSchool(request.getSchool());
        book.setYear(request.getYear());
        book.setUrgent(request.getUrgent() != null ? request.getUrgent() : false);
        book.setAllowOffers(request.getAllowOffers() != null ? request.getAllowOffers() : true);
        book.setSellerId(sellerId);
//        book.setStatus(request.getStatus() != null ? request.getStatus() : "active");
        // admin duyệt trước khi được đăng bán
        if ("draft".equals(request.getStatus())) {
            book.setStatus("draft");
        } else {
            book.setStatus("pending");
        }
        book.setViewCount(0);
        book.setFavoriteCount(0);
        book.setIsSold(false);

        // Convert lists to JSON strings
        try {
            book.setImages(objectMapper.writeValueAsString(request.getImages()));
            book.setDeliveryMethods(objectMapper.writeValueAsString(request.getDeliveryMethods()));

            // Build tags
            List<String> tags = new ArrayList<>();
            if (book.getUrgent()) {
                tags.add("Bán gấp");
            }
            if (book.getAllowOffers()) {
                tags.add("Cho phép trả giá");
            }
            if (request.getDeliveryMethods() != null) {
                for (String method : request.getDeliveryMethods()) {
                    if ("meet".equals(method)) tags.add("Gặp mặt");
                    else if ("cod".equals(method)) tags.add("Ship COD");
                    else if ("transfer".equals(method)) tags.add("Chuyển khoản");
                }
            }
            if (request.getLocationText() != null && !request.getLocationText().isEmpty()) {
                tags.add("Giao dịch: " + request.getLocationText());
            }
            book.setTags(objectMapper.writeValueAsString(tags));
            book.setLocationText(request.getLocationText());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error processing listing data", e);
        }

        Book saved = bookRepository.save(book);
        return mapToResponse(saved);
    }

    @Transactional
    public ListingResponse updateListing(String bookId, UpdateListingRequest request, UUID sellerId) {
        Book book = bookRepository.findByIdAndSellerId(bookId, sellerId)
                .orElseThrow(() -> new RuntimeException("Listing not found or unauthorized"));

        if (request.getTitle() != null) book.setTitle(request.getTitle());
        if (request.getDescription() != null) book.setDescription(request.getDescription());
        if (request.getPrice() != null) book.setPrice(request.getPrice());
        if (request.getCondition() != null) book.setCondition(request.getCondition());
        if (request.getAllowOffers() != null) book.setAllowOffers(request.getAllowOffers());
        if (request.getLocationText() != null) book.setLocationText(request.getLocationText());
        if (request.getStatus() != null) book.setStatus(request.getStatus());

        if (request.getImages() != null) {
            try {
                book.setImages(objectMapper.writeValueAsString(request.getImages()));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error processing images", e);
            }
        }

        if (request.getDeliveryMethods() != null) {
            try {
                book.setDeliveryMethods(objectMapper.writeValueAsString(request.getDeliveryMethods()));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error processing delivery methods", e);
            }
        }

        Book updated = bookRepository.save(book);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteListing(String bookId, UUID sellerId) {
        Book book = bookRepository.findByIdAndSellerId(bookId, sellerId)
                .orElseThrow(() -> new RuntimeException("Listing not found or unauthorized"));
        bookRepository.delete(book);
    }

    public ListingResponse getListingById(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        return mapToResponse(book);
    }

    public Book getBookEntityById(String bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    public Page<ListingResponse> getListingsByStatus(String status, Pageable pageable) {
        // Ưu tiên bài boost lên trước
        return bookRepository.findByStatusOrderByBoostAndCreatedAtDesc(status, LocalDateTime.now(), pageable)
                .map(this::mapToResponse);
    }

    public Page<ListingResponse> getUserListings(UUID sellerId, Pageable pageable) {
        return bookRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable)
                .map(this::mapToResponse);
    }

    public Page<ListingResponse> getListings(Pageable pageable) {
        return bookRepository.findAll(pageable).map(this::mapToResponse);
    }

    public Page<ListingResponse> getListings(
            Pageable pageable,
            String status,
            String category,
            String school,
            Integer minPrice,
            Integer maxPrice,
            String sort) {
        
        LocalDateTime now = LocalDateTime.now();
        
        // Không có filter → mặc định chỉ hiện active (ẩn sách đã bán)
        if (status == null && category == null && school == null && 
            minPrice == null && maxPrice == null) {
            return bookRepository.findByStatusOrderByBoostAndCreatedAtDesc("active", now, pageable)
                    .map(this::mapToResponse);
        }

        // Nếu chỉ lọc theo status (trường hợp phổ biến nhất: active)
        if (status != null && category == null && school == null && 
            minPrice == null && maxPrice == null) {
            return bookRepository.findByStatusOrderByBoostAndCreatedAtDesc(status, now, pageable)
                    .map(this::mapToResponse);
        }

        // Lọc theo status + category
        if (status != null && category != null && school == null && 
            minPrice == null && maxPrice == null) {
            return bookRepository.findByStatusAndCategoryOrderByBoostAndCreatedAtDesc(status, category, now, pageable)
                    .map(this::mapToResponse);
        }

        // Lọc theo status + school
        if (status != null && school != null && category == null && 
            minPrice == null && maxPrice == null) {
            return bookRepository.findByStatusAndSchoolOrderByBoostAndCreatedAtDesc(status, school, now, pageable)
                    .map(this::mapToResponse);
        }

        // Lọc theo status + category + school
        if (status != null && category != null && school != null && 
            minPrice == null && maxPrice == null) {
            return bookRepository.findByStatusAndCategoryAndSchoolOrderByBoostAndCreatedAtDesc(status, category, school, now, pageable)
                    .map(this::mapToResponse);
        }

        // Fallback cho các trường hợp có price filter: dùng findAll (cần custom query phức tạp hơn)
        return bookRepository.findAll(pageable).map(this::mapToResponse);
    }
    
    @Transactional
    public ListingResponse boostListing(String bookId, UUID sellerId, int amount, int days) {
        Book book = bookRepository.findByIdAndSellerId(bookId, sellerId)
                .orElseThrow(() -> new RuntimeException("Listing not found or unauthorized"));
        
        // Trừ tiền từ wallet
        walletService.deduct(sellerId, amount);
        
        // Set boostExpiry
        LocalDateTime expiry = LocalDateTime.now().plusDays(days);
        book.setBoostExpiry(expiry);
        
        // Nếu mua gói urgent thì set urgent (gói 10k = 10000, gói combo 39k = 39000)
        boolean isUrgentPackage = (amount == 10000 || amount == 39000);
        if (isUrgentPackage) {
            book.setUrgent(true);
        }
        
        Book updated = bookRepository.save(book);
        
        // Ghi nhận giao dịch
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID().toString());
        tx.setBook(book.getTitle()); // book (nullable=false) - tên sách
        tx.setPartner(sellerId.toString()); // partner (nullable=false) - user id
        tx.setWhenTime(LocalDateTime.now().toString()); // whenTime (nullable=false)
        tx.setBuyerId(sellerId);
        tx.setSellerId(null);
        tx.setBookId(bookId);
        tx.setType("boost");
        tx.setAmount(String.valueOf(amount));
        tx.setStatus("completed");
        tx.setIsCompleted(true);
        tx.setCompletedAt(LocalDateTime.now());
        tx.setPaymentMethod("wallet");
        tx.setNotes("Mua gói dịch vụ đẩy tin cho sách: " + book.getTitle());
        transactionService.create(tx);
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public ListingResponse updateListingStatus(String bookId, String status) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        book.setStatus(status);
        Book updated = bookRepository.save(book);
        return mapToResponse(updated);
    }

    @Transactional
    public ListingResponse rejectListing(String bookId, String reason) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        book.setStatus("rejected");
        book.setRejectReason(reason);
        Book updated = bookRepository.save(book);
        return mapToResponse(updated);
    }

    private ListingResponse mapToResponse(Book book) {
        try {
            List<String> images = book.getImages() != null ?
                    objectMapper.readValue(book.getImages(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)) :
                    new ArrayList<>();

            List<String> deliveryMethods = book.getDeliveryMethods() != null ?
                    objectMapper.readValue(book.getDeliveryMethods(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)) :
                    new ArrayList<>();

            List<String> tags = book.getTags() != null ?
                    objectMapper.readValue(book.getTags(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)) :
                    new ArrayList<>();

            // Build seller info
            ListingResponse.SellerInfo sellerInfo = null;
            if (book.getSellerId() != null) {
                User seller = userRepository.findById(book.getSellerId()).orElse(null);
                if (seller != null) {
                    sellerInfo = ListingResponse.SellerInfo.builder()
                            .id(seller.getId().toString())
                            .name(seller.getName())
                            .avatarUrl(seller.getAvatarUrl())
                            .rating(seller.getRating())
                            .salesCount(seller.getSalesCount())
                            .build();
                }
            }

            return ListingResponse.builder()
                    .id(book.getId())
                    .title(book.getTitle())
                    .description(book.getDescription())
                    .category(book.getCategory())
                    .condition(book.getCondition())
                    .price(book.getPrice())
                    .originalPrice(book.getOriginalPrice())
                    .author(book.getAuthor())
                    .publisher(book.getPublisher())
                    .edition(book.getEdition())
                    .school(book.getSchool())
                    .year(book.getYear())
                    .urgent(book.getUrgent())
                    .boostExpiry(book.getBoostExpiry())
                    .allowOffers(book.getAllowOffers())
                    .images(images)
                    .deliveryMethods(deliveryMethods)
                    .tags(tags)
                    .locationText(book.getLocationText())
                    .status(book.getStatus())
                    .sellerId(book.getSellerId().toString())
                    .seller(sellerInfo)
                    .createdAt(book.getCreatedAt())
                    .updatedAt(book.getUpdatedAt())
                    .isSold(book.getIsSold())
                    .soldAt(book.getSoldAt())
                    .viewCount(book.getViewCount())
                    .favoriteCount(book.getFavoriteCount())
                    .rejectReason(book.getRejectReason())
                    .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error mapping book to response", e);
        }
    }

    public List<ListingResponse> getPendingListings() {
        return bookRepository
                .findByStatus("pending")
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
}