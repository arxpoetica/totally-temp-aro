package com.altvil.aro.service.cost.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.LineItem;
import com.altvil.aro.model.LineItemType;
import com.altvil.aro.model.NetworkCostCode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkReport;
import com.altvil.aro.model.NetworkReportSummary;
import com.altvil.aro.model.PlanDemand;
import com.altvil.aro.persistence.repository.EquipmentSummaryCostRepository;
import com.altvil.aro.persistence.repository.FiberSummaryCostRepository;
import com.altvil.aro.persistence.repository.LineItemTypeRepository;
import com.altvil.aro.persistence.repository.NetworkCostCodeRepository;
import com.altvil.aro.persistence.repository.NetworkReportRepository;
import com.altvil.aro.persistence.repository.NetworkReportSummaryRepository;
import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.cost.NetworkStatistic;
import com.altvil.aro.service.cost.NetworkStatisticType;
import com.altvil.aro.service.cost.PlanAnalysisReport;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingService;
import com.altvil.aro.service.price.engine.EquipmentCost;
import com.altvil.aro.service.price.engine.FiberCost;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.enumeration.EnumMappedCodes;
import com.altvil.utils.enumeration.MappedCodes;

@Service
public class CostServiceImpl implements CostService {

	private static final Logger log = LoggerFactory
			.getLogger(CostServiceImpl.class.getName());

	@Autowired
	private PricingService pricingService;
	@Autowired
	private NetworkReportRepository networkReportRepository;
	@Autowired
	private EquipmentSummaryCostRepository equipmentSummaryCostRepository;
	@Autowired
	private FiberSummaryCostRepository fiberSummaryCostRepository;
	@Autowired
	private LineItemTypeRepository lineItemTypeRepository;
	@Autowired
	private NetworkReportSummaryRepository networkReportSummaryRepository;
	@Autowired
	private NetworkCostCodeRepository networkCostCodeRepository;

	private ReportBuilderContext reportBuilderContext;
	private ReportGenerator reportGenerator;

	// TODO Fix this being called 2 times (Should only be called once)
	@PostConstruct
	void PostConstruct() {
		this.reportGenerator = new ReportGenerator();
		reportBuilderContext = new ReportBuilderContext().init();
	}

	@Override
	public PlanAnalysisReport updateWireCenterCosts(OptimizedPlan optimizedPlan) {
		PlanAnalysisReport report = createPlanAnalysisReport(optimizedPlan);
		save(optimizedPlan, createPlanAnalysisReport(optimizedPlan));
		return report;
	}

	private ReportBuilder createReportBuilder(NetworkReportSummary summaryReport) {
		return new ReportBuilder(reportBuilderContext, summaryReport);
	}

	@Transactional
	@Modifying
	private NetworkReportSummary save(OptimizedPlan plan,
			PlanAnalysisReport report) {

		NetworkReportSummary planReport =

		createReportBuilder(
				createReport(plan.getWirecenterNetworkPlan().getPlanId(),
						new NetworkReportSummary()))
				.setPriceModel(report.getPriceModel())
				.setLineItems(report.getNetworkStatistics())
				.setDemand(report.getLocationDemand()).build();

		networkReportSummaryRepository.save(planReport);

		return planReport;
	}

	@Override
	public Double getTotalPlanCost(long planId) {
		return networkReportRepository.getTotalPlanCost(planId);
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
	public PlanAnalysisReport createPlanAnalysisReport(OptimizedPlan network) {

		PriceModel priceModel = createPriceModel(network
				.getWirecenterNetworkPlan());

		DemandCoverage dc = network.getWirecenterNetworkPlan()
				.getDemandCoverage();

		Map<NetworkStatisticType, NetworkStatistic> map = StreamUtil.hash(
				reportGenerator.generateNetworkStatistics(network),
				NetworkStatistic::getNetworkStatisticType);

		return new PlanAnalyisReportImpl(priceModel, dc, map);
	}

	@Override
	public void updateMasterPlanCosts(long planId) {

		networkReportRepository.deleteReportsForPlan(planId);
		//
		// update(planId, ReportType.summary_equipment,
		// (report) -> networkReportRepository
		// .updateMasterPlanEquipmentSummary(report.getId()));
		//
		// update(planId, ReportType.summary_fiber,
		// (report) -> networkReportRepository
		// .updateMasterPlanFiberSummary(report.getId()));
	}

	@Transactional
	private <T extends NetworkReport> T createReport(long planId, T report) {
		report.setPlanId(planId);
		report.setDate(new Date());
		networkReportRepository.save(report);
		return report;
	}

	@Override
	public List<FiberSummaryCost> getFiberReport(long planId) {
		NetworkReportSummary report = networkReportSummaryRepository
				.findOne(planId);
		if (report == null) {
			return Collections.emptyList();
		}
		return fiberSummaryCostRepository.findEquipmentSummaryCosts(report
				.getId());
	}

	@Override
	public List<EquipmentSummaryCost> getEquipmentReport(long planId) {
		NetworkReportSummary report = networkReportSummaryRepository
				.findOne(planId);

		if (report == null) {
			return Collections.emptyList();
		}

		return equipmentSummaryCostRepository.findEquipmentSummaryCost(report
				.getId());
	}

	private interface NetworkStatisticGenerator {
		NetworkStatistic generate(OptimizedPlan plan);
	}

	private static class NetworkStatisticGeneratorDefault implements
			NetworkStatisticGenerator {

		private NetworkStatisticType type;
		private Function<OptimizedPlan, Double> f;

		public NetworkStatisticGeneratorDefault(NetworkStatisticType type,
				Function<OptimizedPlan, Double> f) {
			super();
			this.type = type;
			this.f = f;
		}

		@Override
		public NetworkStatistic generate(OptimizedPlan plan) {
			return new LazyNetworkStatistic(type, () -> f.apply(plan));
		}

	}

	private class ReportGenerator {

		private Collection<NetworkStatisticGenerator> lineItemGenerators = new ArrayList<>();

		public ReportGenerator() {
			super();
			init();
		}

		private void add(NetworkStatisticGenerator lineItemGenerator) {
			lineItemGenerators.add(lineItemGenerator);
		}

		private void add(NetworkStatisticType type,
				Function<OptimizedPlan, Double> f) {
			add(new NetworkStatisticGeneratorDefault(type, f));
		}

		private void init() {
			add(NetworkStatisticType.irr, (ws) -> 0.0);
			add(NetworkStatisticType.npv, (ws) -> 0.0);

		}

		public Collection<NetworkStatistic> generateNetworkStatistics(
				OptimizedPlan plan) {
			return StreamUtil.map(lineItemGenerators, g -> g.generate(plan));
		}

	}

	private static class PlanAnalyisReportImpl implements PlanAnalysisReport {

		private PriceModel priceModel;
		private DemandCoverage demandCoverage;
		private Map<NetworkStatisticType, NetworkStatistic> map;

		public PlanAnalyisReportImpl(PriceModel priceModel,
				DemandCoverage demandCoverage,
				Map<NetworkStatisticType, NetworkStatistic> map) {
			super();
			this.priceModel = priceModel;
			this.demandCoverage = demandCoverage;
			this.map = map;
		}

		@Override
		public PriceModel getPriceModel() {
			return priceModel;
		}

		@Override
		public LocationDemand getLocationDemand() {
			return demandCoverage.getLocationDemand();
		}

		@Override
		public Collection<NetworkStatistic> getNetworkStatistics() {
			return map.values();
		}

	}

	private class ReportBuilderContext {

		private MappedCodes<NetworkNodeType, NetworkCostCode> networkTypeToCostCodeMap;
		private MappedCodes<FiberType, NetworkCostCode> fiberTypeToCostCodeMap;
		private MappedCodes<NetworkStatisticType, LineItemType> networkStatisticToLineItem;
		private Set<FiberType> wellKnowFiber = EnumSet.of(
				FiberType.DISTRIBUTION, FiberType.FEEDER);

		private ReportBuilderContext init() {

			Map<Integer, NetworkCostCode> codeMap = StreamUtil
					.hash(networkCostCodeRepository.findAll(),
							NetworkCostCode::getId);

			networkTypeToCostCodeMap = createNodeMapping(codeMap);
			fiberTypeToCostCodeMap = createFiberMapping(codeMap);
			networkStatisticToLineItem = createLineItemMapping();

			return this;

		}

		private <S extends Enum<S>, D> Map<S, D> createAssociationMap(
				Collection<Object[]> rows, Map<Integer, D> codeMap,
				Class<S> enumType) {

			Map<Integer, S> srcMap = StreamUtil.hash(
					enumType.getEnumConstants(), e -> e.ordinal());

			Map<S, D> result = new EnumMap<>(enumType);

			for (Object[] row : rows) {
				int codeId = ((Number) row[0]).intValue();
				int enumId = ((Number) row[1]).intValue();

				D d = codeMap.get(codeId);
				S s = srcMap.get(enumId);

				if (s == null || d == null) {
					log.warn("Failed to map assoication " + codeId + " "
							+ enumId);
				} else {
					result.put(s, d);
				}

			}

			return result;

		}

		private MappedCodes<NetworkNodeType, NetworkCostCode> createNodeMapping(
				Map<Integer, NetworkCostCode> codeMap) {

			return EnumMappedCodes.create(createAssociationMap(
					networkCostCodeRepository
							.queryCostCodeToNetworkNodeTypeOrdinal(), codeMap,
					NetworkNodeType.class));

		}

		private MappedCodes<FiberType, NetworkCostCode> createFiberMapping(
				Map<Integer, NetworkCostCode> codeMap) {

			return EnumMappedCodes
					.create(createAssociationMap(networkCostCodeRepository
							.queryCostCodeToFiberTypeOrdinal(), codeMap,
							FiberType.class));

		}

		private MappedCodes<NetworkStatisticType, LineItemType> createLineItemMapping() {

			Map<String, LineItemType> map = StreamUtil.hash(
					lineItemTypeRepository.findAll(), LineItemType::getName);

			Map<NetworkStatisticType, LineItemType> result = new EnumMap<>(
					NetworkStatisticType.class);

			for (NetworkStatisticType t : NetworkStatisticType.values()) {

				LineItemType type = map.get(t.getCode());
				if (type == null) {
					throw new RuntimeException("Failed to map " + t);
				}
				result.put(t, type);
			}

			return EnumMappedCodes.create(result);

		}

		public int getNetworkCostCode(NetworkNodeType networkType) {
			return networkTypeToCostCodeMap.getDomain(networkType).getId();
		}

		public int getNetworkCostCode(FiberType fiberType) {
			return fiberTypeToCostCodeMap.getDomain(fiberType).getId();
		}

		public boolean isValid(FiberCost fiberCost) {
			return fiberTypeToCostCodeMap.getSourceCodes().contains(
					fiberCost.getFiberType())
					&& (fiberCost.getTotalCost() > 0 || wellKnowFiber
							.contains(fiberCost.getFiberType()));
		}

		public int getLineItemCode(NetworkStatisticType type) {
			return networkStatisticToLineItem.getDomain(type).getId();
		}

		public int getEntityTypeCode(LocationEntityType type) {
			return type.getTypeCode();
		}

	}

	private class ReportBuilder {

		private ReportBuilderContext ctx;
		private NetworkReportSummary reportSummary;

		public ReportBuilder(ReportBuilderContext ctx,
				NetworkReportSummary reportSummary) {
			super();
			this.ctx = ctx;
			this.reportSummary = reportSummary;
		}

		private EquipmentSummaryCost createEquipmentSummaryCost(
				EquipmentCost cost) {

			EquipmentSummaryCost es = new EquipmentSummaryCost(
					ctx.getNetworkCostCode(cost.getNodeType()), reportSummary);

			es.setAtomicCount(cost.getAtomicUnits());
			es.setPrice(cost.getPrice());
			es.setQuantity(cost.getQuantity());
			es.setTotalCost(cost.getTotal());

			return es;
		}

		private FiberSummaryCost createFiberSummaryCost(FiberCost fiberCost) {

			FiberSummaryCost fc = new FiberSummaryCost(
					ctx.getNetworkCostCode(fiberCost.getFiberType()),
					reportSummary);

			fc.setCostPerMeter(fiberCost.getCostPerMeter());
			fc.setLengthMeters(fiberCost.getLengthMeters());
			fc.setTotalCost(fc.getTotalCost());

			return fc;
		}

		private PlanDemand createPlanDemand(int entityTypeCode,
				DemandStatistic ds) {

			PlanDemand pd = new PlanDemand(entityTypeCode, reportSummary);

			pd.setMaxPremises(0); // TODO
			pd.setMaxRevenue(0); // TODO

			pd.setFairShareDemand(ds.getPenetration());
			pd.setFiberCount(ds.getAtomicUnits());
			pd.setFairShareDemand(ds.getFairShareDemand());
			pd.setPenetration(ds.getPenetration());
			pd.setPlanPremises(ds.getRawCoverage());
			pd.setPlanRevenue(ds.getMonthlyRevenueImpact());

			return pd;
		}

		private LineItem createLineItem(NetworkStatistic networkStat) {

			LineItem lineItem = new LineItem(ctx.getLineItemCode(networkStat
					.getNetworkStatisticType()), reportSummary);

			lineItem.setDoubleValue(networkStat.getValue());

			return lineItem;
		}

		public ReportBuilder setPriceModel(PriceModel priceModel) {

			reportSummary.setEquipmentCosts(priceModel.getEquipmentCosts()
					.stream().map(this::createEquipmentSummaryCost)
					.collect(Collectors.toSet()));

			reportSummary.setFiberCosts(priceModel.getFiberCosts().stream()
					.filter(ctx::isValid).map(this::createFiberSummaryCost)
					.collect(Collectors.toSet()));

			return this;

		}

		public ReportBuilder setDemand(LocationDemand ld) {

			Set<PlanDemand> planDemands = new HashSet<>();

			planDemands.addAll(StreamUtil.map(
					LocationEntityType.values(),
					t -> createPlanDemand(ctx.getEntityTypeCode(t),
							ld.getLocationDemand(t))));

			planDemands.add(createPlanDemand(0, ld));

			reportSummary.setPlanDemands(planDemands);

			return this;

		}

		public ReportBuilder setLineItems(
				Collection<NetworkStatistic> networkStats) {

			reportSummary.setLineItems(networkStats.stream()
					.map(this::createLineItem).collect(Collectors.toSet()));
			return this;
		}

		public NetworkReportSummary build() {
			return reportSummary;
		}

	}

	private static class LazyNetworkStatistic implements NetworkStatistic {

		private NetworkStatisticType type;
		private Supplier<Double> supplier;

		private double val;
		private boolean inited = false;

		public LazyNetworkStatistic(NetworkStatisticType type,
				Supplier<Double> supplier) {
			super();
			this.type = type;
			this.supplier = supplier;
		}

		@Override
		public NetworkStatisticType getNetworkStatisticType() {
			return type;
		}

		@Override
		public double getValue() {
			if (!inited) {
				try {
					val = supplier.get();
				} catch (Throwable err) {
					log.error(err.getMessage(), err);
					val = Double.NaN;
				}
				inited = true;
			}
			return val;
		}

	}

}
