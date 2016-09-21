package com.altvil.aro.service.cu.cache.impl;

import java.io.Serializable;

import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.version.VersionType;

@SuppressWarnings("serial")
public class AroCacheKey implements Serializable, AroKey {

	public static AroKey create(Integer serviceAreaId) {
		return new AroCacheKey(serviceAreaId, -1L);
	}

	public static AroKey create(Integer serviceAreaId, Long deploymentPlanId) {
		return new AroCacheKey(serviceAreaId, deploymentPlanId);
	}

	/**
	 * 
	 */
	private Integer serviceAreaId;
	private Long deploymentPlanId;
	private int hashCode;

	public AroCacheKey(Integer serviceAreaId, Long deploymentPlanId) {
		this.serviceAreaId = serviceAreaId;
		this.deploymentPlanId = deploymentPlanId;
		hashCode = calcHash();
	}

	@Override
	public AroKey toKey(VersionType vt) {

		if (vt == VersionType.NETWORK) {
			if (this.getDeploymentPlanId() == null
					|| this.getDeploymentPlanId() == -1) {
				return new AroCacheKey(this.getServiceAreaId(), 0L);
			}
			return this;
		}

		return new AroCacheKey(this.getServiceAreaId(), -1L);

	}

	private int calcHash() {
		int result = Long.hashCode(serviceAreaId);
		result = 31
				* result
				+ (deploymentPlanId == null ? 0 : Long
						.hashCode(deploymentPlanId));
		return result;

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.service.api.version.BsaKey#getServiceAreaId()
	 */
	@Override
	public Integer getServiceAreaId() {
		return serviceAreaId;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.service.api.version.BsaKey#getDeploymentPlanId()
	 */
	@Override
	public Long getDeploymentPlanId() {
		return deploymentPlanId;
	}

	@Override
	public int hashCode() {
		return hashCode;
	}

	private static <T> boolean equals(T a, T b) {
		if (a == null || b == null) {
			return a == b;
		}
		return a.equals(b);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof AroKey) {
			AroKey other = (AroKey) obj;
			return this.getServiceAreaId().equals(other.getServiceAreaId())
					&& equals(this.getDeploymentPlanId(),
							other.getDeploymentPlanId());
		}
		return false;
	}
	
	
	@Override
	public String getCompositeKey() {
		return serviceAreaId + "_" + deploymentPlanId;
	}

	

}
