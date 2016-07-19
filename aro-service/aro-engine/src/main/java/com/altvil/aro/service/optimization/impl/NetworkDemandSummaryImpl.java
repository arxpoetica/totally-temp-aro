package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.Aggregator;

public class NetworkDemandSummaryImpl implements NetworkDemandSummary {

	private static final Set<DemandTypeEnum> validDemands = EnumSet.of(
			DemandTypeEnum.new_demand, DemandTypeEnum.original_demand,
			DemandTypeEnum.planned_demand);;

	public static NetworkDemandSummary createNetworkDemandSummary(
			Collection<NetworkDemand> demands) {
		return build().add(demands).build();
	}

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
					DemandTypeEnum.class, validDemands,
					() -> NetworkDemand.aggregate());
		}

		@Override
		public void add(NetworkDemandSummary val) {
			val.getNetworkDemands().forEach(d -> {
				demandAggregators.get(d.getDemandType()).add(d);
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
	public Collection<NetworkDemand> getNetworkDemands() {
		return demandMap.values();
	}

	@Override
	public NetworkDemand getNetworkDemand(DemandTypeEnum type) {
		return demandMap.get(type);
	}

}
