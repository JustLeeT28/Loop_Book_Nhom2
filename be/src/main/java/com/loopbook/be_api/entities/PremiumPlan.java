package com.loopbook.be_api.entities;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lb_premium_plans")
public class PremiumPlan {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    private Integer days;

    @Column(columnDefinition = "jsonb")
    private String features;

    @Column(name = "badge_text")
    private String badgeText;

    @Column(name = "badge_color")
    private String badgeColor;

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Integer getDays() { return days; }
    public void setDays(Integer days) { this.days = days; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public String getBadgeText() { return badgeText; }
    public void setBadgeText(String badgeText) { this.badgeText = badgeText; }

    public String getBadgeColor() { return badgeColor; }
    public void setBadgeColor(String badgeColor) { this.badgeColor = badgeColor; }
}