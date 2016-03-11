package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class AssignedEntityDemand  {

	private PinnedLocation pinnedLocation;
	
	private LocationEntity locationEntity;
	private LocationDemand locationDemand ;
	
	public AssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation) {
		super();
		this.locationEntity = locationEntity;
		this.pinnedLocation = pinnedLocation;
		this.locationDemand = locationEntity.getLocationDemand() ;
	}

	public double getHouseholdFiberDemandValue() {
		return locationDemand.getHouseholdFiberDemandValue() ;
	}


	public double getTotalDemand() {
		return locationDemand.getTotalDemand() ;
	}

	public PinnedLocation getPinnedLocation() {
		return pinnedLocation;
	}


	public LocationEntity getLocationEntity() {
		return locationEntity;
	}

}
