package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;

public class NetworkDemand {

	private DemandTypeEnum demandType;
	private SpeedCategory speedCategory;
	private LocationDemand locationDemand;

	public NetworkDemand(DemandTypeEnum demandType,
			SpeedCategory speedCategory, LocationDemand locationDemand) {
		super();
		this.demandType = demandType;
		this.speedCategory = speedCategory;
		this.locationDemand = locationDemand;
	}

	public DemandTypeEnum getDemandType() {
		return demandType;
	}

	public SpeedCategory getSpeedCategory() {
		return speedCategory;
	}

	public LocationDemand getLocationDemand() {
		return locationDemand;
	}

}
