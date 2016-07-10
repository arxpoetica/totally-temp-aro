package com.altvil.aro.model;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.OneToMany;

@Entity
@DiscriminatorValue("0")
public class NetworkReportSummary extends NetworkReport {

	private Set<PlanDemand> planDemands = new HashSet<>();
	private Set<LineItem> lineItems = new HashSet<>();
	private Set<EquipmentSummaryCost> equipmentCosts = new HashSet<>();
	private Set<FiberSummaryCost> fiberCosts = new HashSet<>();

	@OneToMany(cascade = CascadeType.ALL, mappedBy = "networkReportSummary")
	public Set<PlanDemand> getPlanDemands() {
		return planDemands;
	}

	public void setPlanDemands(Set<PlanDemand> planDemands) {
		this.planDemands = planDemands;
	}

	public Set<LineItem> getLineItems() {
		return lineItems;
	}

	public void setLineItems(Set<LineItem> lineItems) {
		this.lineItems = lineItems;
	}

	public Set<EquipmentSummaryCost> getEquipmentCosts() {
		return equipmentCosts;
	}

	public void setEquipmentCosts(Set<EquipmentSummaryCost> equipmentCosts) {
		this.equipmentCosts = equipmentCosts;
	}

	public Set<FiberSummaryCost> getFiberCosts() {
		return fiberCosts;
	}

	public void setFiberCosts(Set<FiberSummaryCost> fiberCosts) {
		this.fiberCosts = fiberCosts;
	}

}
