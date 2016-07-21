package com.altvil.aro.service.optimization.wirecenter;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.utils.func.Aggregator;

public class NetworkDemand {

	public static Aggregator<NetworkDemand> aggregate(DemandTypeEnum dt) {
		return new NetworkDemandAggregator(dt);
	}

	public static class NetworkDemandAggregator implements
			Aggregator<NetworkDemand> {

		private Aggregator<LocationDemand> demandAggregator = DefaultLocationDemand
				.demandAggregate();
		
		private DemandTypeEnum demandType = DemandTypeEnum.undefined;
		private SpeedCategory speedCategory = SpeedCategory.cat3;
		
		public NetworkDemandAggregator(DemandTypeEnum dt) {
			this.demandType = dt ;
		}

		@Override
		public void add(NetworkDemand val) {
			// These 2 are really a composite key. TODO fix up
			this.demandType = val.getDemandType();
			this.speedCategory = val.getSpeedCategory();

			demandAggregator.add(val.getLocationDemand());
		}

		@Override
		public NetworkDemand apply() {
			return new NetworkDemand(demandType, speedCategory,
					demandAggregator.apply());
		}

	}

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

	@Override
	public String toString() {
		return new ToStringBuilder(this).append("demandType", demandType)
				.append("speedCategory", speedCategory)
				.append("locationDemand", locationDemand.toString()).build();
	}

}
