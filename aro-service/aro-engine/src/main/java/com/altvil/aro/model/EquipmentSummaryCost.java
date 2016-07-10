package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "equipment_summary_cost", schema = "financial")
public class EquipmentSummaryCost {

	private EquipmentSummaryCostKey id;

	private NetworkReportSummary networkReportSummary;

	private double atomicCount;
	private double quantity;
	private double price;
	private double totalCost;

	@EmbeddedId
	public EquipmentSummaryCostKey getId() {
		return id;
	}

	public void setId(EquipmentSummaryCostKey id) {
		this.id = id;
	}

	@JoinColumn(referencedColumnName = "network_report_id", insertable = false, updatable = false)
	@ManyToOne(optional = false)
	public NetworkReportSummary getNetworkReportSummary() {
		return networkReportSummary;
	}

	public void setNetworkReportSummary(
			NetworkReportSummary networkReportSummary) {
		this.networkReportSummary = networkReportSummary;
	}

	@Column(name = "atomic_count")
	public double getAtomicCount() {
		return atomicCount;
	}

	public void setAtomicCount(double atomicCount) {
		this.atomicCount = atomicCount;
	}

	@Column(name = "quantity")
	public double getQuantity() {
		return quantity;
	}

	public void setQuantity(double quantity) {
		this.quantity = quantity;
	}

	@Column(name = "price")
	public double getPrice() {
		return price;
	}

	public void setPrice(double price) {
		this.price = price;
	}

	@Column(name = "total_cost")
	public double getTotalCost() {
		return totalCost;
	}

	public void setTotalCost(double totalCost) {
		this.totalCost = totalCost;
	}

}
