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
@javax.persistence.Table(name = "deployment_plan_versions", schema = "cache")
public class DeploymentPlanVersionEntity {
	DeploymentPlanVersionKey key;
	Long deploymentVersion = 0l;
	Date lastUpdated = new Date();
	Integer optlock = 0;

	@EmbeddedId
	public DeploymentPlanVersionKey getKey() {
		return key;
	}

	public void setKey(DeploymentPlanVersionKey key) {
		this.key = key;
	}

	@Basic
	@Column(name = "deployment_version")
	public Long getDeploymentVersion() {
		return deploymentVersion;
	}

	public void setDeploymentVersion(Long deploymentVersion) {
		this.deploymentVersion = deploymentVersion;
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
