package com.altvil.aro.service.report;

import java.util.Collection;

import com.altvil.utils.func.Aggregator;

public interface ReportGenerator {

	public abstract Collection<NetworkStatistic> generateNetworkStatistics(
			GeneratedPlan plan);

	public abstract Aggregator<Collection<NetworkStatistic>> createAggregator();

}