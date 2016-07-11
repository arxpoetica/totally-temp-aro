package com.altvil.aro.model;

import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "line_item", schema = "financial")
public class LineItem {

	private LineItemKey id;
	private NetworkReportSummary networkReportSummary ;
	private Double doubleValue;
	
	public LineItem() {
	}
	
	public LineItem(LineItemKey id) {
		this.id = id ;
	}
	
	public LineItem(int lineItemType, long networkReportId) {
		this(new LineItemKey(lineItemType, networkReportId)) ;
	}

	@EmbeddedId
	public LineItemKey getId() {
		return id;
	}

	public void setId(LineItemKey id) {
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


	@Column(name = "value")
	public Double getDoubleValue() {
		return doubleValue;
	}

	public void setDoubleValue(Double doubleValue) {
		this.doubleValue = doubleValue;
	}

}
