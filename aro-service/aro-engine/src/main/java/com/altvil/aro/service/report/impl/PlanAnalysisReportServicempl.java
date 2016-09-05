package com.altvil.aro.service.report.impl;

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.impl.NetworkDemandSummaryImpl;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingContext;
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
import com.altvil.aro.service.report.ReportGenerator.AnalysisInput;
import com.altvil.interfaces.FiberCableConstructionType;
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
		
		log.info("create Price Builder") ;
		
		PriceModelBuilder b = pricingService.createBuilder("*", new Date(),
				new PricingContext());
	
		log.info("stream Network Nodes Pricing") ;
		
		plan.getNetworkNodes().forEach(
				n -> b.add(n.getNetworkNodeType(), 1, n.getAtomicUnit()));

		log.info("stream Fiber Pricing") ;
		
		for (FiberCableConstructionType ft : plan
				.getFiberCableConstructionTypes()) {
			b.add(ft, plan.getFiberLengthInMeters(ft));
		}
		
		log.info("Build Fiber Pricing") ;
		
		return b.build();

	}

	private PriceModel createPriceModel() {
		return pricingService.createBuilder("*", new Date(),
				new PricingContext()).build();
	}

	
	@Override
	public PlanAnalysisReport aggregate(OptimizationConstraints constraints, Iterable<PlanAnalysisReport> reports) {
		Aggregator<PlanAnalysisReport> aggreagtor = createAggregator(constraints);
		reports.forEach(aggreagtor::add);
		return aggreagtor.apply();
	}
	

//	@Override
//	public PlanAnalysisReport aggregate(GeneratedRootPlan rootPlan) {
//		Aggregator<PlanAnalysisReport> aggreagtor = createAggregator(rootPlan
//				.getOptimizationRequest().getOptimizationConstraints());
//
//		rootPlan.getOptimizedPlans().stream()
//				.map(OptimizedMasterPlan::getPlanAnalysisReport)
//				.forEach(aggreagtor::add);
//		
//		return aggreagtor.apply();
//	}
//
//	@Override
//	public PlanAnalysisReport aggregate(GeneratedMasterPlan masterPlan) {
//
//		Aggregator<PlanAnalysisReport> aggreagtor = createAggregator(masterPlan
//				.getOptimizationRequest().getOptimizationConstraints());
//
//		masterPlan.getOptimizedPlans().stream()
//				.map(OptimizedPlan::getPlanAnalysisReport)
//				.forEach(aggreagtor::add);
//
//		return aggreagtor.apply();
//	}

	@Override
	public PlanAnalysisReport createPlanAnalysisReport() {
		PriceModel priceModel = createPriceModel();
		Map<NetworkStatisticType, NetworkStatistic> map = new HashMap<>();

		networkStatisticGenerator.createNetworkStatistic(
				NetworkStatisticType.irr, Double.NaN);

		map.put(NetworkStatisticType.irr, networkStatisticGenerator
				.createNetworkStatistic(NetworkStatisticType.irr, Double.NaN));
		map.put(NetworkStatisticType.npv, networkStatisticGenerator
				.createNetworkStatistic(NetworkStatisticType.npv, Double.NaN));

		LocationDemand ld = DefaultLocationDemand.build().build();

		NetworkDemandSummaryImpl.Builder b = NetworkDemandSummaryImpl.build();
		b.add(DemandTypeEnum.new_demand, SpeedCategory.cat7, ld)
				.add(DemandTypeEnum.original_demand, SpeedCategory.cat3, ld)
				.add(DemandTypeEnum.planned_demand, SpeedCategory.cat7, ld);

		return new PlanAnalysisReportImpl(priceModel, b.build(), map);

	}

	@Override
	public PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan network) {

		log.info("Create Price Model");
		
		PriceModel priceModel = createPriceModel(network
				.getWirecenterNetworkPlan());

		log.info("Create Network Stats");
		
		
		Collection<NetworkStatistic> stats = reportGenerator
				.createNetworkStatistic(new AnalysisInput() {
					@Override
					public int getYears() {
						return network.getOptimizationConstraints().getYears();
					}

					@Override
					public double getDiscountRate() {
						return network.getOptimizationConstraints()
								.getDiscountRate();
					}

					@Override
					public double getFixedCost() {
						return priceModel.getTotalCost();
					}

					@Override
					public NetworkDemandSummary getNetworkDemandSummary() {
						return network.getDemandSummary();
					}

				});
		
		
		Map<NetworkStatisticType, NetworkStatistic> map = StreamUtil.hash(
				stats, NetworkStatistic::getNetworkStatisticType);

		log.info("Created Network Stats");
		
		return new PlanAnalysisReportImpl(priceModel,
				network.getDemandSummary(), map);
	}

	private Aggregator<PlanAnalysisReport> createAggregator(
			OptimizationConstraints optimizationConstraints) {
		return new PlanAnalysisReportAggregator(optimizationConstraints);
	}

	private class PlanAnalysisReportAggregator implements
			Aggregator<PlanAnalysisReport> {

		private OptimizationConstraints constraints;

		public PlanAnalysisReportAggregator(OptimizationConstraints constraints) {
			super();

			this.constraints = constraints;
			priceModelAggregator = pricingService.aggregate();
			demandAggregator = NetworkDemandSummaryImpl.aggregate();

		}

		private Aggregator<PriceModel> priceModelAggregator;
		private Aggregator<NetworkDemandSummary> demandAggregator;

		@Override
		public void add(PlanAnalysisReport val) {
			priceModelAggregator.add(val.getPriceModel());
			demandAggregator.add(val.getDemandSummary());
		}

		@Override
		public PlanAnalysisReport apply() {

			PriceModel priceModel = priceModelAggregator.apply();
			NetworkDemandSummary demandSummary = demandAggregator.apply();

			Collection<NetworkStatistic> stats = networkStatisticGenerator
					.createReportGenerator().createNetworkStatistic(
							new AnalysisInput() {

								@Override
								public int getYears() {
									return constraints.getYears();
								}

								@Override
								public NetworkDemandSummary getNetworkDemandSummary() {
									return demandSummary;
								}

								@Override
								public double getFixedCost() {
									return priceModel.getTotalCost();
								}

								@Override
								public double getDiscountRate() {
									return constraints.getDiscountRate();
								}
							});

			return new PlanAnalysisReportImpl(priceModel, demandSummary,
					StreamUtil.hash(stats,
							NetworkStatistic::getNetworkStatisticType));
		}

	}

}
