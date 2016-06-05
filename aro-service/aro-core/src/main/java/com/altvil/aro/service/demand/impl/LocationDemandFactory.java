package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.demand.LocationTypeMask;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public class LocationDemandFactory {

	public static final LocationDemandFactory FACTORY = new LocationDemandFactory();

	private LocationDemandFactory() {
	}


	

	public Builder build(Set<LocationEntityType> mask) {
		return new Builder(LocationTypeMask.MASK.toMask(mask));
	}

	public class Builder {

		private Set<LocationEntityType> mask;

		Map<LocationEntityType, DemandStatistic> demands = new EnumMap<>(
				LocationEntityType.class);

		public Builder(Set<LocationEntityType> mask) {
			super();
			this.mask = mask;
		}

		public Builder add(LocationEntityType type, double coverage,
				double revenue) {
			DemandStatistic houseHoldStat = new DefaultDemandStatistic(
					coverage, coverage, revenue);
			demands.put(type, houseHoldStat);
			return this;
		}

		public Builder addWithRevenue(LocationEntityType type, double coverage,
				double revenue) {

			DemandStatistic stat = null;

			if (mask.contains(type)) {
				stat = new DefaultDemandStatistic(coverage, coverage,
						revenue);
			} else {
				stat = DefaultDemandStatistic.ZERO_DEMAND ;
			}

			demands.put(type, stat);
			return this;
		}

		public LocationDemand build() {
			return DefaultLocationDemand.create(demands);
		}
	}

}
