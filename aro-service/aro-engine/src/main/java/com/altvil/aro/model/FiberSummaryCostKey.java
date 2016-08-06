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

	public FiberSummaryCostKey(int costCode,
			long networkReportId) {
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
	public boolean equals(Object other) {

		if (this == other)
			return true;

		if (other == null) {
			return false;
		}

		if( other instanceof FiberSummaryCostKey) {
			FiberSummaryCostKey fsc = (FiberSummaryCostKey) other;
			return fsc.getCostCode() == getCostCode()
					&& fsc.getNetworkReportId() == getNetworkReportId();
		}
		
		return false ;
		

	}

	@Override
	public int hashCode() {
		int result = Integer.hashCode(getCostCode());
		result = 31 * result + Long.hashCode(getNetworkReportId());
		return result;
	}

}
