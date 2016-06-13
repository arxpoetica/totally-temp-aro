package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "equipment_summary_cost", schema = "financial")
public class EquipmentSummaryCost {

	private Long id;
	private int costCode;
	private long  networkReportId ;
	private double atomicCount;
	private double quantity;
	private double price;
	private double totalCost;

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Column(name = "network_cost_code_id")
	public int getCostCode() {
		return costCode;
	}

	public void setCostCode(int costCode) {
		this.costCode = costCode;
	}

	@Column(name = "network_report_id")
	public long getNetworkReportId() {
		return networkReportId;
	}

	public void setNetworkReportId(long networkReportId) {
		this.networkReportId = networkReportId;
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
