package com.altvil.aro.model;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

@Entity
@Table(name = "plan_product_demand", schema = "financial")
public class PlanProductDemand extends ComparableModel {

	private Long id;

	private PlanDemand planDemand;
	private int productType;

	private double marketShare  ;
	
	private double selectedRevenueTotal;
	private double selectedFiberCount;

	private double planRevenueTotal;
	private double planRevenueShare;
	private double planFiberCount;

	private double marketPenetration;
	private double productPenetration;

	private Set<PlanEntityDemand> planEntityDemands = new HashSet<>();

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
	@JoinColumn(name = "plan_demand_id", nullable = false)
	public PlanDemand getPlanDemand() {
		return planDemand;
	}

	public void setPlanDemand(PlanDemand planDemand) {
		this.planDemand = planDemand;
	}

	@Column(name = "product_type")
	public int getProductType() {
		return productType;
	}

	public void setProductType(int productType) {
		this.productType = productType;
	}

	@OneToMany(fetch = FetchType.LAZY, mappedBy = "planProductDemand", orphanRemoval = true, cascade = { CascadeType.ALL })
	public Set<PlanEntityDemand> getPlanEntityDemands() {
		return planEntityDemands;
	}

	public void setPlanEntityDemands(Set<PlanEntityDemand> planEntityDemands) {
		this.planEntityDemands = planEntityDemands;
	}

	//
	// Facts
	//

	@Column(name = "selected_revenue_total")
	public double getSelectedRevenueTotal() {
		return selectedRevenueTotal;
	}

	public void setSelectedRevenueTotal(double selectedRevenueTotal) {
		this.selectedRevenueTotal = selectedRevenueTotal;
	}

	@Column(name = "selected_fiber_count")
	public double getSelectedFiberCount() {
		return selectedFiberCount;
	}

	public void setSelectedFiberCount(double selectedFiberCount) {
		this.selectedFiberCount = selectedFiberCount;
	}

	
	@Column(name = "plan_revenue_total")
	public double getPlanRevenueTotal() {
		return planRevenueTotal;
	}

	public void setPlanRevenueTotal(double planRevenueTotal) {
		this.planRevenueTotal = planRevenueTotal;
	}

	@Column(name = "plan_revenue_share")
	public double getPlanRevenueShare() {
		return planRevenueShare;
	}

	public void setPlanRevenueShare(double planRevenueShare) {
		this.planRevenueShare = planRevenueShare;
	}



	@Column(name = "plan_fiber_count")
	public double getPlanFiberCount() {
		return planFiberCount;
	}

	public void setPlanFiberCount(double planFiberCount) {
		this.planFiberCount = planFiberCount;
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

	@Column(name="market_share")
	public double getMarketShare() {
		return marketShare;
	}

	public void setMarketShare(double marketShare) {
		this.marketShare = marketShare;
	}
	
	
}
