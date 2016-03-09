package com.altvil.aro.service.graph.transform.ftp;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class AssignedEntityDemand {

	private PinnedLocation pinnedLocation;
	private LocationEntity locationEntity;
	private Collection<LocationEntityDemand> locationDemand;
	private double totalFiberDemand;

	public AssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation,
			Collection<LocationEntityDemand> locationDemand) {
		super();
		this.locationEntity = locationEntity;
		this.pinnedLocation = pinnedLocation;
		this.locationDemand = locationDemand;
	}

	public PinnedLocation getPinnedLocation() {
		return pinnedLocation;
	}

	public Collection<LocationEntityDemand> getLocationDemand() {
		return locationDemand;
	}

	public double getTotalFiberDemand() {
		return totalFiberDemand;
	}

	public LocationEntity getLocationEntity() {
		return locationEntity;
	}

}
