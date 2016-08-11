package com.altvil.netop.model;

import java.util.Collection;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.report.NetworkStatistic;

public class AroPlanAnalysisReport {
	
		
	private AroPriceModel priceModel;
	private NetworkDemandSummary demandSummary;
	private Collection<NetworkStatistic> networkStatistics;

	public AroPlanAnalysisReport(AroPriceModel priceModel,
			NetworkDemandSummary demandSummary,
			Collection<NetworkStatistic> networkStatistics) {
		super();
		this.priceModel = priceModel;
		this.demandSummary = demandSummary;
		this.networkStatistics = networkStatistics;
	}

	public AroPriceModel getPriceModel() {
		return priceModel;
	}

	public NetworkDemandSummary getDemandSummary() {
		return demandSummary;
	}

	public Collection<NetworkStatistic> getNetworkStatistics() {
		return networkStatistics;
	}

}
