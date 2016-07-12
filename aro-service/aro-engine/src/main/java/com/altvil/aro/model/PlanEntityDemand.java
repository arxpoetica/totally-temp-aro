package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "plan_entity_demand", schema = "financial")
public class PlanEntityDemand extends ComparableModel {

	private Long id;

	private PlanProductDemand planProductDemand;
	private int entityType;

	private double selectedPremises;
	private double selectedFiberCount;
	private double selectedRevenueTotal;

	private double planPremises;
	private double planFiberCount;
	private double planRevenueTotal;
	private double planRevenueShare;

	private double marketPenetration;
	private double productPenetration;

	private double sharePremises;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Override
	protected Serializable idKey() {
		return id;
	}

	@ManyToOne
	@JoinColumn(name = "plan_product_demand_id", nullable = false)
	public PlanProductDemand getPlanProductDemand() {
		return planProductDemand;
	}

	public void setPlanProductDemand(PlanProductDemand planDemand) {
		this.planProductDemand = planDemand;
	}

	@Column(name = "entity_type")
	public int getEntityType() {
		return entityType;
	}

	public void setEntityType(int entityType) {
		this.entityType = entityType;
	}

	@Column(name = "selected_premises")
	public double getSelectedPremises() {
		return selectedPremises;
	}

	public void setSelectedPremises(double selectedPremises) {
		this.selectedPremises = selectedPremises;
	}

	@Column(name = "selected_fiber_count")
	public double getSelectedFiberCount() {
		return selectedFiberCount;
	}

	public void setSelectedFiberCount(double selectedFiberCount) {
		this.selectedFiberCount = selectedFiberCount;
	}
	
	@Column(name="selected_revenue_total")
	public double getSelectedRevenueTotal() {
		return selectedRevenueTotal;
	}

	public void setSelectedRevenueTotal(double selectedRevenueTotal) {
		this.selectedRevenueTotal = selectedRevenueTotal;
	}

	@Column(name = "plan_premises")
	public double getPlanPremises() {
		return planPremises;
	}

	public void setPlanPremises(double planPremises) {
		this.planPremises = planPremises;
	}

	@Column(name = "plan_fiber_count")
	public double getPlanFiberCount() {
		return planFiberCount;
	}

	public void setPlanFiberCount(double planFiberCount) {
		this.planFiberCount = planFiberCount;
	}

	@Column(name = "plan_revenue_total")
	public double getPlanRevenueTotal() {
		return planRevenueTotal;
	}

	public void setPlanRevenueTotal(double planRevenueTotal) {
		this.planRevenueTotal = planRevenueTotal;
	}

	@Column(name="plan_revenue_share")
	public double getPlanRevenueShare() {
		return planRevenueShare;
	}

	public void setPlanRevenueShare(double planRevenueShare) {
		this.planRevenueShare = planRevenueShare;
	}

	@Column(name = "market_penetration")
	public double getMarketPenetration() {
		return marketPenetration;
	}

	public void setMarketPenetration(double marketPenetration) {
		this.marketPenetration = marketPenetration;
	}

	@Column(name = "product_penetration")
	public double getProductPenetration() {
		return productPenetration;
	}

	public void setProductPenetration(double productPenetration) {
		this.productPenetration = productPenetration;
	}

	@Column(name = "share_premises")
	public double getSharePremises() {
		return sharePremises;
	}

	public void setSharePremises(double sharePremises) {
		this.sharePremises = sharePremises;
	}

}
