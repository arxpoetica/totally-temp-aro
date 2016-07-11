package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "plan_demand", schema = "financial")
public class PlanDemand {

	private PlanDemandKey id;
	private NetworkReportSummary networkReportSummary;

	private double maxPremises;
	private double maxRevenue;

	private double planPremises;
	private double planRevenue;

	private double fairShareDemand;
	private double penetration;

	private double fiberCount;

	public PlanDemand() {
	}

	public PlanDemand(PlanDemandKey id) {
		this.id = id;
	}

	public PlanDemand(int entityType, NetworkReportSummary networkReportSummary) {
		this(new PlanDemandKey(entityType, networkReportSummary.getId()));
		this.networkReportSummary = networkReportSummary ;
	}

	@EmbeddedId
	public PlanDemandKey getId() {
		return id;
	}

	public void setId(PlanDemandKey planDemandKey) {
		id = planDemandKey;
	}

	@JoinColumn(name = "network_report_id", referencedColumnName="id", insertable = false, updatable = false)
	@ManyToOne(optional = false)
	public NetworkReportSummary getNetworkReportSummary() {
		return networkReportSummary;
	}

	public void setNetworkReportSummary(
			NetworkReportSummary networkReportSummary) {
		this.networkReportSummary = networkReportSummary;
	}

	@Column(name = "max_premises")
	public double getMaxPremises() {
		return maxPremises;
	}

	public void setMaxPremises(double maxPremisies) {
		this.maxPremises = maxPremisies;
	}

	@Column(name = "max_revenue")
	public double getMaxRevenue() {
		return maxRevenue;
	}

	public void setMaxRevenue(double maxRevenue) {
		this.maxRevenue = maxRevenue;
	}

	@Column(name = "plan_premises")
	public double getPlanPremises() {
		return planPremises;
	}

	public void setPlanPremises(double planPremises) {
		this.planPremises = planPremises;
	}

	@Column(name = "plan_revenue")
	public double getPlanRevenue() {
		return planRevenue;
	}

	public void setPlanRevenue(double planRevenue) {
		this.planRevenue = planRevenue;
	}

	@Column(name = "fair_share_demand")
	public double getFairShareDemand() {
		return fairShareDemand;
	}

	public void setFairShareDemand(double fairShareDemand) {
		this.fairShareDemand = fairShareDemand;
	}

	@Column(name = "penetration")
	public double getPenetration() {
		return penetration;
	}

	public void setPenetration(double penetration) {
		this.penetration = penetration;
	}

	@Column(name = "fiber_count")
	public double getFiberCount() {
		return fiberCount;
	}

	public void setFiberCount(double fiberCount) {
		this.fiberCount = fiberCount;
	}

}
