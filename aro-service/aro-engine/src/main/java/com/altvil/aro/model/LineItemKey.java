package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@SuppressWarnings("serial")
@Embeddable
public class LineItemKey implements Serializable {

	private int lineItemType;
	private long networkReportId;

	public LineItemKey() {
	}

	public LineItemKey(int lineItemType, long networkReportId) {
		super();
		this.lineItemType = lineItemType;
		this.networkReportId = networkReportId;
	}

	@Column(name = "line_item_type")
	public int getLineItemType() {
		return lineItemType;
	}

	public void setLineItemType(int lineItemType) {
		this.lineItemType = lineItemType;
	}

	@Column(name = "network_report_id")
	public long getNetworkReportId() {
		return networkReportId;
	}

	public void setNetworkReportId(long networkReportId) {
		this.networkReportId = networkReportId;
	}

	@Override
	public boolean equals(Object o) {

		if (this == o)
			return true;

		if (o == null) {
			return false;
		}

		LineItemKey other = (LineItemKey) o;
		return other.getLineItemType() == getLineItemType()
				&& other.getNetworkReportId() == getNetworkReportId();

	}

	@Override
	public int hashCode() {
		int result = Integer.hashCode(getLineItemType());
		result = 31 * result + Long.hashCode(getNetworkReportId());
		return result;
	}

}
