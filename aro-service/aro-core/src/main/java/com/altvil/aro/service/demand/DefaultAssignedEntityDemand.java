package com.altvil.aro.service.demand;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.Pair;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class DefaultAssignedEntityDemand implements PinnedAssignedEntityDemand {

	private PinnedLocation pinnedLocation;

	private LocationEntity locationEntity;
	private LocationDemand locationDemand;

	public DefaultAssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation, LocationDemand locationDemand) {
		super();
		this.locationEntity = locationEntity;
		this.pinnedLocation = pinnedLocation;
		this.locationDemand = locationDemand;
	}
	
	

	@Override
	public double getAtomicUnits() {
		return locationDemand.getAtomicUnits() ;
	}

	

	@Override
	public LocationDemand getLocationDemand(){
		return locationDemand ;
	}

//	public double getHouseholdFiberDemandValue() {
//		return locationDemand.getAtomicUnits();
//	}

//	public double getAtomicUnits() {
//		return locationDemand.getAtomicUnits();
//	}
	
	public PinnedLocation getPinnedLocation() {
		return pinnedLocation;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.demand.AssignedAssignedEntityDemand#getLocationEntity()
	 */
	@Override
	public LocationEntity getLocationEntity() {
		return locationEntity;
	}
	
	
	@Override
	public Pair<PinnedAssignedEntityDemand> split(Pair<LocationDemand> pair) {
		return new Pair<PinnedAssignedEntityDemand>(new DefaultAssignedEntityDemand(
				locationEntity, pinnedLocation, pair.getHead()),
				new DefaultAssignedEntityDemand(locationEntity, pinnedLocation, pair
						.getTail()));
	}
	
	
	public String toString() {
		return new ToStringBuilder(this)
				.append("locationDemand", locationDemand)
				.append("locationEntity", locationEntity)
				.append("pinnedLocation", pinnedLocation)
				.toString();
	}

}
