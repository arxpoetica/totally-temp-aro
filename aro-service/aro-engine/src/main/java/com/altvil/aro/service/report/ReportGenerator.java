package com.altvil.aro.service.report;

import java.util.Collection;

import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.utils.func.Aggregator;

public interface ReportGenerator {

	public  Collection<NetworkStatistic> generateNetworkStatistics(
			GeneratedPlan plan, PriceModel priceModel);

	public  Aggregator<Collection<NetworkStatistic>> createAggregator();

}