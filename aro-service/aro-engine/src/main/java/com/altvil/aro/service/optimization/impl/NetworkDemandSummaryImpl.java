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
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.Aggregator;

public class NetworkDemandSummaryImpl implements NetworkDemandSummary {

	public static Builder build() {
		return new Builder();
	}

	public static Aggregator<NetworkDemandSummary> aggregate() {
		return new NetworkDemandSummaryAggreagtor();
	}

	private static class NetworkDemandSummaryAggreagtor implements
			Aggregator<NetworkDemandSummary> {

		private Map<DemandTypeEnum, Aggregator<NetworkDemand>> demandAggregators;

		public NetworkDemandSummaryAggreagtor() {
			demandAggregators = StreamUtil.createAggregator(
					DemandTypeEnum.class, () -> NetworkDemand.aggregate());
		}

		@Override
		public void add(NetworkDemandSummary val) {
			val.getDemandTypes().forEach(dt -> {
				demandAggregators.get(dt).add(val.getNetworkDemand(dt));
			});
		}

		@Override
		public NetworkDemandSummary apply() {
			return new NetworkDemandSummaryImpl(StreamUtil.apply(
					DemandTypeEnum.class, demandAggregators));
		}

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

		public NetworkDemandSummary build() {
			return demand;
		}
	}

	private Map<DemandTypeEnum, NetworkDemand> demandMap;

	private NetworkDemandSummaryImpl(
			Map<DemandTypeEnum, NetworkDemand> demandMap) {
		this.demandMap = demandMap;
	}

	private NetworkDemandSummaryImpl() {
		this(new EnumMap<>(DemandTypeEnum.class));
	}

	@Override
	public Collection<DemandTypeEnum> getDemandTypes() {
		return demandMap.keySet();
	}

	@Override
	public NetworkDemand getNetworkDemand(DemandTypeEnum type) {
		return demandMap.get(type);
	}

}
