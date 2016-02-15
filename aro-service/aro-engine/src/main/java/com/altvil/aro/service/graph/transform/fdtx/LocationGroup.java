package com.altvil.aro.service.graph.transform.fdtx;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;



public class LocationGroup {
	private List<LocationAggregate> aggregates = new ArrayList<>();
	private int locationCount;
	//private LocationsStream stream;

	public LocationGroup(LocationsStream stream) {
		//this.stream = stream;
	}

	public void add(LocationAggregate la) {
		this.aggregates.add(la);
		this.locationCount += la.locationCount();
	}

	public int getLocationCount() {
		return locationCount;
	}

	public Collection<LocationAggregate> aggregates() {
		return aggregates;
	}
}
