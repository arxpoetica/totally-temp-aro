package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.Pair;
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
		return locationDemand.getDemand();
	}

	public double getTotalDemand() {
		return locationDemand.getDemand();
	}

	public PinnedLocation getPinnedLocation() {
		return pinnedLocation;
	}

	public LocationEntity getLocationEntity() {
		return locationEntity;
	}

	public Pair<AssignedEntityDemand> split(double demand) {

		Pair<LocationDemand> pair = locationDemand.splitDemand(demand);
		return new Pair<AssignedEntityDemand>(new AssignedEntityDemand(
				locationEntity, pinnedLocation, pair.getHead()),
				new AssignedEntityDemand(locationEntity, pinnedLocation, pair
						.getTail()));

	}

}
