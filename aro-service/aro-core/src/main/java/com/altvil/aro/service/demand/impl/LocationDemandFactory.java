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

	private LocationDemand defaultDemand;
	private LocationDemand zeroDemand;

	private LocationDemandFactory() {
		defaultDemand = create(1.0, 0.0, 0.0);
		zeroDemand = create(0, 0, 0);
	}

	public LocationDemand getDefaultDemand() {
		return defaultDemand;
	}

	public LocationDemand getZeroDemand() {
		return zeroDemand;
	}

	public LocationDemand create(double houseHold, double business,
			double cellTower) {
		return DefaultLocationDemand.create(houseHold > 0 ? 1 : 0,
				business > 0 ? 1 : 0, cellTower > 0 ? 8 : 1);
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

		public Builder addWithArpu(LocationEntityType type, double coverage,
				double arpu) {

			DemandStatistic stat = null;

			if (mask.contains(type)) {
				double demoCount = (coverage == 0) ? 0 : 1;
				stat = new DefaultDemandStatistic(demoCount, demoCount,
						coverage * arpu);
			} else {
				stat = zeroDemand;
			}

			demands.put(type, stat);
			return this;
		}

		public LocationDemand build() {
			return DefaultLocationDemand.create(demands);
		}
	}

}
