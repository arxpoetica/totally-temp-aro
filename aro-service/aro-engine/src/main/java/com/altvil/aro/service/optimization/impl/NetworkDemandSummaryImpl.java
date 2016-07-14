package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class NetworkDemandSummaryImpl implements NetworkDemandSummary {

	public static Builder build() {
		return new Builder();
	}

	public static class Builder {
		NetworkDemandSummaryImpl demand = new NetworkDemandSummaryImpl();

		public Builder add(DemandTypeEnum type, SpeedCategory speed,
				LocationDemand ld) {
			demand.demandMap.put(type, new NetworkDemand(type, speed, ld));
			return this;
		}

		public Builder add(Collection<NetworkDemand> demands) {
			for (NetworkDemand d : demands) {
				demand.demandMap.put(d.getDemandType(), d);
			}
			return this;
		}

		public Builder setDemandCoverage(DemandCoverage dc) {
			add(DemandTypeEnum.planned_demand, SpeedCategory.cat7,
					dc.getLocationDemand());
			demand.demandCoverage = dc;
			return this;
		}

		public NetworkDemandSummary build() {
			return demand;
		}
	}

	private Map<DemandTypeEnum, NetworkDemand> demandMap = new EnumMap<>(
			DemandTypeEnum.class);

	private DemandCoverage demandCoverage;

	public NetworkDemandSummaryImpl() {
		super();
	}

	@Override
	public Collection<DemandTypeEnum> getDemandTypes() {
		return demandMap.keySet();
	}

	@Override
	public NetworkDemand getNetworkDemand(DemandTypeEnum type) {
		return demandMap.get(type);
	}

	@Override
	public DemandCoverage getDemandCoverage() {
		return demandCoverage;
	}
}
