package com.altvil.aro.service.report.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.NetworkStatisticType;
import com.altvil.aro.service.report.PlanAnalysisReport;

public class PlanAnalysisReportImpl implements PlanAnalysisReport {

	private PriceModel priceModel;
	private NetworkDemandSummary demandSummary;
	private Map<NetworkStatisticType, NetworkStatistic> map;

	public PlanAnalysisReportImpl(PriceModel priceModel,
			NetworkDemandSummary demandSummary,
			Map<NetworkStatisticType, NetworkStatistic> map) {
		super();
		this.priceModel = priceModel;
		this.demandSummary = demandSummary;
		this.map = map;
	}

	@Override
	public NetworkDemandSummary getDemandSummary() {
		return demandSummary;
	}

	@Override
	public PriceModel getPriceModel() {
		return priceModel;
	}

	@Override
	public Collection<NetworkStatistic> getNetworkStatistics() {
		return map.values();
	}

}

