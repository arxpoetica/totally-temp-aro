package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@SuppressWarnings("serial")
@Embeddable
public class FiberSummaryCostKey implements Serializable {

	private int costCode;
	private long networkReportId;

	public FiberSummaryCostKey() {
	}

	public FiberSummaryCostKey(int costCode, long networkReportId) {
		super();
		this.costCode = costCode;
		this.networkReportId = networkReportId;
	}

	@Column(name = "network_cost_code_id")
	public int getCostCode() {
		return costCode;
	}

	public void setCostCode(int costCodeId) {
		this.costCode = costCodeId;
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

		EquipmentSummaryCostKey other = (EquipmentSummaryCostKey) o;
		return other.getCostCode() == getCostCode()
				&& other.getNetworkReportId() == getNetworkReportId();

	}

	@Override
	public int hashCode() {
		int result = Integer.hashCode(getCostCode());
		result = 31 * result + Long.hashCode(getNetworkReportId());
		return result;
	}

}
