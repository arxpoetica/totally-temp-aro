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

	private PlanDemand planDemand;
	private int entityType;

	private double premises;
	private double fiberCount;
	private double revenueTotal;
	private double revenueShare;
	private double penetration;
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
	@JoinColumn(name = "plan_demand_id", nullable = false)
	public PlanDemand getPlanDemand() {
		return planDemand;
	}

	public void setPlanDemand(PlanDemand planDemand) {
		this.planDemand = planDemand;
	}

	@Column(name = "entity_type")
	public int getEntityType() {
		return entityType;
	}

	public void setEntityType(int entityType) {
		this.entityType = entityType;
	}

	@Column(name = "premises")
	public double getPremises() {
		return premises;
	}

	public void setPremises(double premises) {
		this.premises = premises;
	}

	@Column(name = "fiber_count")
	public double getFiberCount() {
		return fiberCount;
	}

	public void setFiberCount(double fiberCount) {
		this.fiberCount = fiberCount;
	}

	@Column(name = "revenue_total")
	public double getRevenueTotal() {
		return revenueTotal;
	}

	public void setRevenueTotal(double revenueTotal) {
		this.revenueTotal = revenueTotal;
	}

	@Column(name = "revenue_share")
	public double getRevenueShare() {
		return revenueShare;
	}

	public void setRevenueShare(double revenueShare) {
		this.revenueShare = revenueShare;
	}

	@Column(name = "penetration")
	public double getPenetration() {
		return penetration;
	}

	public void setPenetration(double penetration) {
		this.penetration = penetration;
	}

	@Column(name = "share_premises")
	public double getSharePremises() {
		return sharePremises;
	}

	public void setSharePremises(double sharePremises) {
		this.sharePremises = sharePremises;
	}

}
