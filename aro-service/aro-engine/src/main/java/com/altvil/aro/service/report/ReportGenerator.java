package com.altvil.aro.service.report;

import java.util.Collection;

import com.altvil.utils.func.Aggregator;

public interface ReportGenerator {

	public  Collection<NetworkStatistic> generateNetworkStatistics(
			GeneratedPlan plan);

	public  Aggregator<Collection<NetworkStatistic>> createAggregator();

}