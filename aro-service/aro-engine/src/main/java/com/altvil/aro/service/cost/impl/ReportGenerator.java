package com.altvil.aro.service.cost.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.cost.NetworkStatistic;
import com.altvil.aro.service.cost.NetworkStatisticType;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.utils.func.Aggregator;

public class ReportGenerator {

	
	private NetworkStatisticType type;
	private Function<OptimizedPlan, Double> f;

	

	public Collection<NetworkStatistic> reduce(
			Map<NetworkStatisticType, List<NetworkStatistic>> map) {

		return null;
	}

	private void add(NetworkStatisticType type,
			Function<OptimizedPlan, Double> f) {
		// add(new NetworkStatisticGeneratorDefault(type, f));
	}

	private void init() {
		add(NetworkStatisticType.irr, (ws) -> 0.0);
		add(NetworkStatisticType.npv, (ws) -> 0.0);
	}

	
}
