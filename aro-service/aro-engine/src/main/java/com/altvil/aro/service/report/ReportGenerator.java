package com.altvil.aro.service.report;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.utils.func.Aggregator;

public interface ReportGenerator {

	
	//TODO Unify API with ROIC and reduce the number of interfaces
	public interface AnalysisInput {
		int getYears();

		double getDiscountRate();

		double getFixedCost();

		NetworkDemandSummary getNetworkDemandSummary();

	}

	Collection<NetworkStatistic> createNetworkStatistic(AnalysisInput input);

	Aggregator<Collection<NetworkStatistic>> createAggregator();

}