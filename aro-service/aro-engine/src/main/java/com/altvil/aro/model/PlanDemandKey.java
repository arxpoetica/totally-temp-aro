package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@SuppressWarnings("serial")
@Embeddable
public class PlanDemandKey implements Serializable {

	private int entityType;
	private long networkReportId;
	
	public PlanDemandKey() {
	}
	
	
	public PlanDemandKey(int entityType, long networkReportId) {
		super();
		this.entityType = entityType;
		this.networkReportId = networkReportId;
	}


	@Column(name = "network_report_id")
	public int getEntityType() {
		return entityType;
	}

	public long getNetworkReportId() {
		return networkReportId;
	}

	public void setNetworkReportId(long networkReporId) {
		this.networkReportId = networkReporId;
	}

	public void setEntityType(int entityType) {
		this.entityType = entityType;
	}
	
	@Override
	public boolean equals(Object o) {

		if (this == o)
			return true;

		if (o == null) {
			return false;
		}

		PlanDemandKey other = (PlanDemandKey) o;
		return other.getEntityType() == getEntityType()
				&& other.getNetworkReportId() == getNetworkReportId();

	}

	@Override
	public int hashCode() {
		int result = Integer.hashCode(getEntityType());
		result = 31 * result + Long.hashCode(getNetworkReportId());
		return result;
	}

}
