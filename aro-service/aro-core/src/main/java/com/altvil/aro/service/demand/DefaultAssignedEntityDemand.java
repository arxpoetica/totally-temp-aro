package com.altvil.aro.service.demand;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.Pair;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class DefaultAssignedEntityDemand implements DemandStatistic, PinnedAssignedEntityDemand {

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
	
	public DefaultAssignedEntityDemand(LocationEntity locationEntity,
			PinnedLocation pinnedLocation) {
		this(locationEntity, pinnedLocation, locationEntity.getLocationDemand());
	}
	
	
	@Override
	public DemandStatistic ratio(double ratio) {
		 return new DefaultAssignedEntityDemand(getLocationEntity(), this.pinnedLocation, (LocationDemand) locationDemand.ratio(ratio));
	}

	@Override
	public double getRawCoverage() {
		return locationDemand.getRawCoverage() ;
	}

	@Override
	public double getDemand() {
		return locationDemand.getDemand() ;
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return locationDemand.getMonthlyRevenueImpact() ;
	}

	@Override
	public LocationDemand getLocationDemand(){
		return locationDemand ;
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

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.demand.AssignedAssignedEntityDemand#getLocationEntity()
	 */
	@Override
	public LocationEntity getLocationEntity() {
		return locationEntity;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.demand.AssignedAssignedEntityDemand#split(double)
	 */
	@Override
	public Pair<PinnedAssignedEntityDemand> split(double demand) {

		Pair<LocationDemand> pair = locationDemand.splitDemand(demand);
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
