package com.altvil.aro.service.report;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.price.engine.PriceModel;

public interface PlanAnalysisReport {

	PriceModel getPriceModel() ;
	NetworkDemandSummary getDemandSummary() ;
	Collection<NetworkStatistic> getNetworkStatistics() ;
	
}
