package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@SuppressWarnings("serial")
@Embeddable
public class DeploymentPlanVersionKey implements Serializable {
	Integer serviceAreaId;
	Long deploymentPlanId;

	@Column(name = "service_area_id")
	public Integer getServiceAreaId() {
		return serviceAreaId;
	}

	public void setServiceAreaId(Integer serviceAreaId) {
		this.serviceAreaId = serviceAreaId;
	}

	@Column(name = "deployment_plan_id")
	public Long getDeploymentPlanId() {
		return deploymentPlanId;
	}

	public void setDeploymentPlanId(Long deploymentPlanId) {
		this.deploymentPlanId = deploymentPlanId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;

		DeploymentPlanVersionKey that = (DeploymentPlanVersionKey) o;

		if (getServiceAreaId() != null ? !getServiceAreaId().equals(
				that.getServiceAreaId()) : that.getServiceAreaId() != null)
			return false;
		return !(getDeploymentPlanId() != null ? !getDeploymentPlanId().equals(
				that.getDeploymentPlanId())
				: that.getDeploymentPlanId() != null);

	}

	@Override
	public int hashCode() {
		int result = getServiceAreaId() != null ? getServiceAreaId().hashCode()
				: 0;
		result = 31
				* result
				+ (getDeploymentPlanId() != null ? getDeploymentPlanId()
						.hashCode() : 0);
		return result;
	}

	@Override
	public String toString() {
		return " serviceAreaId=" + serviceAreaId + ", deploymentPlanId="
				+ deploymentPlanId + ' ';
	}
}
