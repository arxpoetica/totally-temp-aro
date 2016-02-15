package com.altvil.aro.service.entity;

import java.util.Collection;

public class DropCableSummary {

	private Collection<DropCableCount> counts;
	
	
	public DropCableSummary() {
	}
	

	public DropCableSummary(Collection<DropCableCount> counts) {
		super();
		this.counts = counts;
	}

	public Collection<DropCableCount> getCounts() {
		return counts;
	}

	public void setCounts(Collection<DropCableCount> counts) {
		this.counts = counts;
	}

}
