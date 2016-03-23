package com.altvil.aro.service.demand;

import java.util.Collection;
import java.util.stream.Collectors;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class AssignedEntityDemand {

	private PinnedLocation pinnedLocation;

	private LocationEntity locationEntity;
	private LocationDemand locationDemand;

	public AssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation, LocationDemand locationDemand) {
		super();
		this.locationEntity = locationEntity;
		this.pinnedLocation = pinnedLocation;
		this.locationDemand = locationDemand;
	}

	public AssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation) {
		this(locationEntity, pinnedLocation, locationEntity.getLocationDemand());
	}

	public double getHouseholdFiberDemandValue() {
		return locationDemand.getTotalDemand();
	}

	public double getTotalDemand() {
		return locationDemand.getTotalDemand();
	}

	public PinnedLocation getPinnedLocation() {
		return pinnedLocation;
	}

	public LocationEntity getLocationEntity() {
		return locationEntity;
	}

	public Collection<AssignedEntityDemand> split(int max) {
		return locationDemand
				.splitDemand(max)
				.stream()
				.map(led -> new AssignedEntityDemand(locationEntity,
						pinnedLocation, led)).collect(Collectors.toList());
	}

}
