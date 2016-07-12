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
@Table(name = "plan_demand", schema = "financial")
public class PlanDemand extends ComparableModel {

	private Long id;
	private NetworkReportSummary networkReportSummary;

	private double selectedLocations;
	private double totalRevenue;
	private double shareRevenue;
	private double marketPenetration;

	private Set<PlanProductDemand> planProductDemands = new HashSet<>();

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
	protected Serializable getIdKey() {
		return id;
	}

	@ManyToOne
	@JoinColumn(name = "network_report_id", nullable = false)
	public NetworkReportSummary getNetworkReportSummary() {
		return networkReportSummary;
	}

	@OneToMany(fetch = FetchType.LAZY, mappedBy = "planDemand", orphanRemoval = true, cascade = { CascadeType.ALL })
	public Set<PlanProductDemand> getPlanProductDemands() {
		return planProductDemands;
	}

	public void setPlanProductDemands(Set<PlanProductDemand> planProductDemands) {
		this.planProductDemands = planProductDemands;
	}

	public void setNetworkReportSummary(
			NetworkReportSummary networkReportSummary) {
		this.networkReportSummary = networkReportSummary;
	}

	@Column(name = "selected_locations")
	public double getSelectedLocations() {
		return selectedLocations;
	}

	public void setSelectedLocations(double selectedLocations) {
		this.selectedLocations = selectedLocations;
	}

	@Column(name = "total_revenue")
	public double getTotalRevenue() {
		return totalRevenue;
	}

	public void setTotalRevenue(double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}

	@Column(name = "share_revenue")
	public double getShareRevenue() {
		return shareRevenue;
	}

	public void setShareRevenue(double shareRevenue) {
		this.shareRevenue = shareRevenue;
	}

	@Column(name = "market_penetration")
	public double getMarketPenetration() {
		return marketPenetration;
	}

	public void setMarketPenetration(double marketPenetration) {
		this.marketPenetration = marketPenetration;
	}

}
