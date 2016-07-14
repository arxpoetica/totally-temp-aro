package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "fiber_summary_cost", schema = "financial")
public class FiberSummaryCost {

	private FiberSummaryCostKey id;

	private NetworkReportSummary networkReportSummary;

	double lengthMeters;
	double costPerMeter;
	double totalCost;
	
	
	public FiberSummaryCost() {
	}

	public FiberSummaryCost(FiberSummaryCostKey id) {
		this.id = id ;
	}
	
	public FiberSummaryCost(int costCode, NetworkReportSummary networkReportSummary) {
		this(new FiberSummaryCostKey(costCode, networkReportSummary.getId())) ;
		this.networkReportSummary = networkReportSummary ;
	}
	
	@EmbeddedId
	public FiberSummaryCostKey getId() {
		return id;
	}

	public void setId(FiberSummaryCostKey id) {
		this.id = id;
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