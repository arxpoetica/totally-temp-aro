package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class DeploymentPlanCacheKey implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Integer serviceAreaId;
	private Long deploymentPlanId;
	private String cacheType;

	public DeploymentPlanCacheKey(Integer serviceAreaId,
			Long deploymentPlanId, String cacheType) {
		super();
		this.serviceAreaId = serviceAreaId;
		this.deploymentPlanId = deploymentPlanId == null ? -1
				: deploymentPlanId;
		this.cacheType = cacheType;
	}

	public DeploymentPlanCacheKey() {
	}

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

	@Column(name = "cache_type")
	public String getCacheType() {
		return cacheType;
	}

	public void setCacheType(String caheType) {
		this.cacheType = caheType;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;

		DeploymentPlanCacheKey that = (DeploymentPlanCacheKey) o;

		if (getServiceAreaId() != null ? !getServiceAreaId().equals(
				that.getServiceAreaId()) : that.getServiceAreaId() != null) {
			return false;
		}

		if (getCacheType() != null ? !getCacheType()
				.equals(that.getCacheType()) : that.getCacheType() != null) {
			return false;
		}

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
		result = 31 * result
				+ (getCacheType() != null ? getCacheType().hashCode() : 0);
		return result;
	}

	@Override
	public String toString() {
		return " serviceAreaId=" + serviceAreaId + ", deploymentPlanId="
				+ deploymentPlanId + ' ' + ", caheType=" + cacheType + ' ';
	}
}
