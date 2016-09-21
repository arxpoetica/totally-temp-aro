package com.altvil.aro.service.cu.version.spi;

import java.util.Date;
import java.util.Map;

import com.altvil.aro.service.cu.key.AroKey;

public class VersionUpdates {

	private Map<AroKey, Long> updates;
	private Date lastUpdate;

	public VersionUpdates(Map<AroKey, Long> updates, Date lastUpdate) {
		super();
		this.updates = updates;
		this.lastUpdate = lastUpdate;
	}

	public Map<AroKey, Long> getUpdates() {
		return updates;
	}

	public Date getLastUpdate() {
		return lastUpdate;
	}

}
