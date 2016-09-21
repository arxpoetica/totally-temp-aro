package com.altvil.aro.model;

import java.util.Date;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.PreUpdate;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Version;

@Entity
@javax.persistence.Table(name = "service_area_versions", schema = "cache")
public class ServiceAreaVersionEntity {
	ServiceAreaAndPlanVersionKey key;
	Long serviceAreaVersion = 0l;
	Date lastUpdated = new Date();
	Integer optlock = 0;

	@EmbeddedId
	public ServiceAreaAndPlanVersionKey getKey() {
		return key;
	}

	public void setKey(ServiceAreaAndPlanVersionKey key) {
		this.key = key;
	}

	@Basic
	@Column(name = "service_area_version")
	public Long getServiceAreaVersion() {
		return serviceAreaVersion;
	}

	public void setServiceAreaVersion(Long deploymentVersion) {
		this.serviceAreaVersion = deploymentVersion;
	}

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "last_updated")
	public Date getLastUpdated() {
		return lastUpdated;
	}

	public void setLastUpdated(Date lastUpdated) {
		this.lastUpdated = lastUpdated;
	}

	@Version
	@Column(name = "optlock")
	public Integer getOptlock() {
		return optlock;
	}

	public void setOptlock(Integer optlock) {
		this.optlock = optlock;
	}

	@PreUpdate
	void preUpdate() {
		setLastUpdated(new Date(System.currentTimeMillis()));
	}

}
