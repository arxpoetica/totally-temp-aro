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
@javax.persistence.Table(name = "cache_entries", schema = "cache")
public class CacheEntity {
	private Date lastUpdated = new Date();
	private PlanCacheKey key;
	private Long optiLock = 0L;
	private Long version;
	private Long locationVersion;
	private Long length = 0L;
	private Long serviceAreaVersion;

	@EmbeddedId
	public PlanCacheKey getKey() {
		return key;
	}

	public void setKey(PlanCacheKey key) {
		this.key = key;
	}

	@Version
	@Column(name = "optlock")
	public Long getOptiLock() {
		return optiLock;
	}

	public void setOptiLock(Long optiLock) {
		this.optiLock = optiLock;
	}

	@Basic
	@Column(name = "deployment_version", insertable = false, updatable = false)
	public Long getVersion() {
		return version;
	}

	public void setVersion(Long version) {
		this.version = version;
	}

	@Basic
	@Column(name = "location_version", insertable = false, updatable = false)
	public Long getLocationVersion() {
		return locationVersion;
	}

	public void setLocationVersion(Long locationVersion) {
		this.locationVersion = locationVersion;
	}

	@Basic
	@Column(name = "service_area_version", insertable = false, updatable = false)
	public Long getServiceAreaVersion() {
		return serviceAreaVersion;
	}

	public void setServiceAreaVersion(Long serviceAreaVersion) {
		this.serviceAreaVersion = serviceAreaVersion;
	}
	// @Lob
	// @Column(name = "cache_data", length = 10000000)
	// public byte[] getCacheData() {
	// return cacheData;
	// }
	//
	// public void setCacheData(byte[] cacheData) {
	// this.cacheData = cacheData;
	// }

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "last_updated")
	public Date getLastUpdated() {
		return lastUpdated;
	}

	public void setLastUpdated(Date lastUpdated) {
		this.lastUpdated = lastUpdated;
	}

	@Basic
	@Column(name = "length", insertable = false, updatable = false)
	public Long getLength() {
		return length;
	}

	public void setLength(Long length) {
		this.length = length;
	}

	@PreUpdate
	void preUpdate() {
		setLastUpdated(new Date(System.currentTimeMillis()));
	}


}
