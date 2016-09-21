package com.altvil.aro.service.cu.version;

import com.altvil.aro.service.cu.key.AroKey;

public class VersionEvent {

	private AroKey key;
	private VersionType versionType;
	private Long version;

	public VersionEvent(AroKey key, VersionType versionType, Long version) {
		super();
		this.key = key;
		this.versionType = versionType;
		this.version = version;
	}

	public AroKey getKey() {
		return key;
	}

	public VersionType getVersionType() {
		return versionType;
	}

	public Long getVersion() {
		return version;
	}

}
