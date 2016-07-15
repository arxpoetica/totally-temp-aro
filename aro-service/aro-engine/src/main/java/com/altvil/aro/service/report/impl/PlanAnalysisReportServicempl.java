package com.altvil.aro.service.report.impl;

import java.util.Collection;
import java.util.Date;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimization.impl.NetworkDemandSummaryImpl;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingService;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.NetworkStatisticType;
import com.altvil.aro.service.report.NetworkStatisticsService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.report.PlanAnalysisReportService;
import com.altvil.aro.service.report.ReportGenerator;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.Aggregator;

@Service
public class PlanAnalysisReportServicempl implements PlanAnalysisReportService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(PlanAnalysisReportServicempl.class.getName());

	@Autowired
	private PricingService pricingService;

	@Autowired
	private NetworkStatisticsService networkStatisticGenerator;


	private ReportGenerator reportGenerator;

	// TODO Fix this being called 2 times (Should only be called once)
	@PostConstruct
	void PostConstruct() {
		this.reportGenerator = networkStatisticGenerator
				.createReportGenerator();
	}

	private PriceModel createPriceModel(WirecenterNetworkPlan plan) {
		PriceModelBuilder b = pricingService.createBuilder("*", new Date());
		plan.getNetworkNodes().forEach(
				n -> b.add(n.getNetworkNodeType(), 1, n.getAtomicUnit()));
		for (FiberType ft : FiberType.values()) {
			b.add(ft, plan.getFiberLengthInMeters(ft));
		}

		return b.build();

	}
	

	@Override
	public PlanAnalysisReport aggregate(Collection<PlanAnalysisReport> plans) {
		Aggregator<PlanAnalysisReport> aggreagtor = createAggregator() ;
		plans.forEach(aggreagtor::add);
		return aggreagtor.apply() ;
	}

	@Override
	public PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan network) {

		PriceModel priceModel = createPriceModel(network
				.getWirecenterNetworkPlan());
		
		Map<NetworkStatisticType, NetworkStatistic> map = StreamUtil.hash(
				reportGenerator.generateNetworkStatistics(network),
				NetworkStatistic::getNetworkStatisticType);

		return new PlanAnalysisReportImpl(priceModel,
				network.getDemandSummary(), map);
	}

	private Aggregator<PlanAnalysisReport> createAggregator() {
		return new PlanAnalysisReportAggregator();
	}

	private class PlanAnalysisReportAggregator implements
			Aggregator<PlanAnalysisReport> {

		private Aggregator<PriceModel> priceModelAggregator;
		private Aggregator<NetworkDemandSummary> demandAggregator;
		private Aggregator<Collection<NetworkStatistic>> statAggregator;
		
		public PlanAnalysisReportAggregator() {
			priceModelAggregator = pricingService.aggregate() ;
			demandAggregator = NetworkDemandSummaryImpl.aggregate() ;
			statAggregator = reportGenerator.createAggregator() ;
		}

		@Override
		public void add(PlanAnalysisReport val) {
			priceModelAggregator.add(val.getPriceModel());
			demandAggregator.add(val.getDemandSummary());
			statAggregator.add(val.getNetworkStatistics());
		}

		@Override
		public PlanAnalysisReport apply() {
			return new PlanAnalysisReportImpl(priceModelAggregator.apply(),
					demandAggregator.apply(), StreamUtil.hash(
							statAggregator.apply(),
							NetworkStatistic::getNetworkStatisticType));
		}

	}	
	
}
