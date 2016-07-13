package com.altvil.aro.model;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import com.altvil.aro.service.demand.analysis.SpeedCategory;

@Entity
@Table(name = "plan_demand", schema = "financial")
public class PlanDemand extends ComparableModel {

	private Long id;
	private NetworkReportSummary networkReportSummary;
	
	private SpeedCategory speedType ;
	private int productType ;
	private DemandTypeEnum demandType ;
	
	private double marketPenetration;

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
	@JoinColumn(name = "network_report_id", nullable = false)
	public NetworkReportSummary getNetworkReportSummary() {
		return networkReportSummary;
	}
	
	@OneToMany(fetch = FetchType.LAZY, mappedBy = "planDemand", orphanRemoval = true, cascade = { CascadeType.ALL })
	public Set<PlanEntityDemand> getPlanEntityDemands() {
		return planEntityDemands;
	}

	public void setPlanEntityDemands(Set<PlanEntityDemand> planEntityDemands) {
		this.planEntityDemands = planEntityDemands;
	}

	

	public void setNetworkReportSummary(
			NetworkReportSummary networkReportSummary) {
		this.networkReportSummary = networkReportSummary;
	}

	
	@Column(name = "market_penetration")
	public double getMarketPenetration() {
		return marketPenetration;
	}

	public void setMarketPenetration(double marketPenetration) {
		this.marketPenetration = marketPenetration;
	}

	@Enumerated(EnumType.ORDINAL)
	@Column(name="speed_type")
	public SpeedCategory getSpeedType() {
		return speedType;
	}

	public void setSpeedType(SpeedCategory speedType) {
		this.speedType = speedType;
	}

	@Column(name="product_type")
	public int getProductType() {
		return productType;
	}

	public void setProductType(int productType) {
		this.productType = productType;
	}

	@Enumerated(EnumType.ORDINAL)
	@Column(name="demand_type")
	public DemandTypeEnum getDemandType() {
		return demandType;
	}

	public void setDemandType(DemandTypeEnum demandType) {
		this.demandType = demandType;
	}
	
	

}
