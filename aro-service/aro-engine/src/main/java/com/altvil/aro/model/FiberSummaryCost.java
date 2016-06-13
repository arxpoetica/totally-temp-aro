package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;


@Entity
@Table(name = "fiber_summary_cost", schema = "financial")
public class FiberSummaryCost {

	private Long id;
	private int costCode;
	private long  networkReportId ;
	
	double lengthMeters ;
	double costPerMeter;
	double totalCost ;	
	
	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public int getCostCode() {
		return costCode;
	}

	@Column(name = "network_cost_code_id")
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
	
	
	@Column(name = "length_meters")
	public double getLengthMeters() {
		return lengthMeters;
	}

	public void setLengthMeters(double lengthMeters) {
		this.lengthMeters = lengthMeters;
	}

	@Column(name = "cost_per_meter")
	public double getCostPerMeter() {
		return costPerMeter;
	}

	public void setCostPerMeter(double costPerMeter) {
		this.costPerMeter = costPerMeter;
	}

	@Column(name = "total_cost")
	public double getTotalCost() {
		return totalCost;
	}
	
	public void setTotalCost(double totalCost) {
		this.totalCost = totalCost;
	}

}