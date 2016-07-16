package com.altvil.aro.service.report.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.LineItem;
import com.altvil.aro.model.LineItemType;
import com.altvil.aro.model.NetworkCostCode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkReport;
import com.altvil.aro.model.NetworkReportSummary;
import com.altvil.aro.model.PlanDemand;
import com.altvil.aro.model.PlanEntityDemand;
import com.altvil.aro.persistence.repository.EquipmentSummaryCostRepository;
import com.altvil.aro.persistence.repository.FiberSummaryCostRepository;
import com.altvil.aro.persistence.repository.LineItemTypeRepository;
import com.altvil.aro.persistence.repository.NetworkCostCodeRepository;
import com.altvil.aro.persistence.repository.NetworkReportRepository;
import com.altvil.aro.persistence.repository.NetworkReportSummaryRepository;
import com.altvil.aro.persistence.repository.PlanDemandRepository;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.impl.NetworkDemandSummaryImpl;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.price.engine.EquipmentCost;
import com.altvil.aro.service.price.engine.FiberCost;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PricingEngine;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.NetworkStatisticType;
import com.altvil.aro.service.report.NetworkStatisticsService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.report.PlanAnalysisReportService;
import com.altvil.aro.service.report.SummarizedPlan;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.enumeration.EnumMappedCodes;
import com.altvil.utils.enumeration.MappedCodes;

@Service
public class NetworkReportServiceImpl implements NetworkReportService {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkReportServiceImpl.class.getName());

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

	@Autowired
	private PlanDemandRepository planDemandRepository;

	@Autowired
	private PricingEngine pricingEngine;

	@Autowired
	private PlanAnalysisReportService planAnalysisReportService;

	@Autowired
	private NetworkStatisticsService networkStatisticsService;

	private ReportBuilderContext reportBuilderContext;
	private PlanAnalysisReportBuilder planAnalysisReportBuilder;

	// TODO Fix this being called 2 times (Should only be called once)
	@PostConstruct
	void PostConstruct() {
		reportBuilderContext = new ReportBuilderContext().init();
		planAnalysisReportBuilder = new PlanAnalysisReportBuilder(
				reportBuilderContext);
	}

	@Override
	public NetworkReportSummary saveNetworkReport(SummarizedPlan plan) {
		networkReportRepository.deleteReportsForPlan(plan.getPlanId());
		return save(plan.getPlanId(), plan.getPlanAnalysisReport());
	}

	@Override
	@Transactional
	public SummarizedPlan loadSummarizedPlan(long planId) {
		return new SummarizedPlanImpl(planId, transformNetworkReportSummary(
				planId, planAnalysisReportBuilder::toAnalysisReport));
	}

	@Override
	@Transactional
	public <T> T transformNetworkReportSummary(long planId,
			Function<NetworkReportSummary, T> transform) {
		return transform.apply(networkReportSummaryRepository
				.queryReportByPlanId(planId));
	}

	private ReportBuilder createReportBuilder(NetworkReportSummary summaryReport) {
		return new ReportBuilder(reportBuilderContext, summaryReport);
	}

	@Transactional
	@Modifying
	private NetworkReportSummary save(long planId, PlanAnalysisReport report) {

		NetworkReportSummary planReport = createReportBuilder(
				createReport(planId, new NetworkReportSummary()))
				.setPriceModel(report.getPriceModel())
				.setLineItems(report.getNetworkStatistics())
				.addDemand(report.getDemandSummary()).build();

		networkReportSummaryRepository.save(planReport);

		return planReport;
	}

	@Override
	public Double getTotalPlanCost(long planId) {
		return networkReportRepository.getTotalPlanCost(planId);
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

	private class ReportBuilderContext {

		private Map<Class<?>, Map<Integer, ?>> costCodeToTypeMapping = new HashMap<>();
		private Map<Class<?>, Function<?, Integer>> costCodeToIdMapping = new HashMap<>();

		private Map<Class<?>, Map<Integer, ?>> enumCodeMapping = new HashMap<>();

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

			initCodes();

			return this;

		}

		private void initCodes() {

			costCodeToTypeMapping.put(
					NetworkNodeType.class,
					indexDomain(networkTypeToCostCodeMap,
							(costCode) -> costCode.getId()));

			costCodeToTypeMapping.put(
					FiberType.class,
					indexDomain(fiberTypeToCostCodeMap,
							(costCode) -> costCode.getId()));

			costCodeToIdMapping.put(
					NetworkNodeType.class,
					createCodeMapping(networkTypeToCostCodeMap,
							(code) -> code.getId()));

			costCodeToIdMapping.put(
					FiberType.class,
					createCodeMapping(fiberTypeToCostCodeMap,
							(code) -> code.getId()));
		
			enumCodeMapping.put(
					LocationEntityType.class,
					StreamUtil.hashEnum(LocationEntityType.class,
							(e) -> e.getTypeCode()));

			enumCodeMapping.put(NetworkNodeType.class,
					StreamUtil.hashEnum(NetworkNodeType.class));

			enumCodeMapping.put(FiberType.class,
					StreamUtil.hashEnum(FiberType.class));

			enumCodeMapping.put(NetworkStatisticType.class,
					indexDomain(networkStatisticToLineItem, l -> l.getId()));

		}

		private <K, S, D> Map<K, S> indexDomain(MappedCodes<S, D> mapping,
				Function<D, K> f) {

			Map<K, S> result = new HashMap<>();

			for (S s : mapping.getSourceCodes()) {
				result.put(f.apply(mapping.getDomain(s)), s);
			}

			return result;

		}

		@SuppressWarnings("rawtypes")
		public <T> Integer getTypeId(T code) {
			@SuppressWarnings("unchecked")
			Function<T, Integer> f = (Function) costCodeToIdMapping.get(code
					.getClass());
			if (f == null) {
				throw new RuntimeException("Failed to map " + code);
			}
			return f.apply(code);
		}

		@SuppressWarnings("rawtypes")
		public <T> T getEnumCode(Class<T> clz, Integer id) {
			@SuppressWarnings("unchecked")
			Map<Integer, T> encodedMap = ((Map) enumCodeMapping.get(clz));
			if (encodedMap == null) {
				throw new RuntimeException("Failed to map code for type " + clz);
			}
			T code = encodedMap.get(id);
			if (code == null) {
				throw new RuntimeException("Failed to map id " + id
						+ " for type  " + clz);
			}
			return encodedMap.get(id);
		}

		@SuppressWarnings("rawtypes")
		public <T> T getCostCode(Class<T> clz, Integer id) {
			@SuppressWarnings("unchecked")
			Map<Integer, T> encodedMap = ((Map) costCodeToTypeMapping.get(clz));
			if (encodedMap == null) {
				throw new RuntimeException("Failed to map code for type " + clz);
			}
			T code = encodedMap.get(id);
			if (code == null) {
				throw new RuntimeException("Failed to map id " + id
						+ " for type  " + clz);
			}
			return encodedMap.get(id);
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

		private <S, D> Function<S, Integer> createCodeMapping(
				MappedCodes<S, D> codeMapping, Function<D, Integer> f) {
			return (s) -> f.apply(codeMapping.getDomain(s));
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

	}

	private class PlanAnalysisReportBuilder {

		private ReportBuilderContext ctx;

		public PlanAnalysisReportBuilder(ReportBuilderContext ctx) {
			super();
			this.ctx = ctx;
		}

		private NetworkDemand toNetworkDemand(PlanDemand demand) {

			DefaultLocationDemand.Builder builder = DefaultLocationDemand
					.build();

			demand.getPlanEntityDemands().forEach(
					ed -> {
						builder.add(
								ctx.getEnumCode(LocationEntityType.class,
										ed.getEntityType()), ed.getPremises(),
								ed.getFiberCount(), ed.getRevenueTotal(),
								ed.getRevenueShare(), ed.getPenetration());
					});

			return new NetworkDemand(demand.getDemandType(),
					demand.getSpeedType(), builder.build());

		}

		private NetworkDemandSummary toNetworkDemandSummary(
				Set<PlanDemand> plandDemands) {
			return NetworkDemandSummaryImpl
					.createNetworkDemandSummary(StreamUtil.map(plandDemands,
							this::toNetworkDemand));
		}

		private NetworkStatistic toNetworkStatistic(LineItem li) {

			return networkStatisticsService.createNetworkStatistic(ctx
					.getEnumCode(NetworkStatisticType.class, li.getId()
							.getLineItemType()), li.getDoubleValue());
		}

		private Collection<NetworkStatistic> toNetworkStatistics(
				Set<LineItem> lineItems) {
			return StreamUtil.map(lineItems, this::toNetworkStatistic);
		}

		private EquipmentCost toEquipmentCost(EquipmentSummaryCost e) {
			return EquipmentCost.createEquipmentCost(ctx.getCostCode(
					NetworkNodeType.class, e.getId().getCostCode()), e
					.getPrice(), e.getQuantity(), e.getTotalCost(), e
					.getAtomicCount());
		}

		private FiberCost toFiberCost(FiberSummaryCost f) {
			return FiberCost.createFiberCost(
					ctx.getCostCode(FiberType.class, f.getId().getCostCode()),
					f.getCostPerMeter(), f.getLengthMeters(), f.getTotalCost());
		}

		private PriceModel toPriceModel(
				Set<EquipmentSummaryCost> equipmentCosts,
				Set<FiberSummaryCost> fiberCosts) {
			return pricingEngine.createPriceModel(
					StreamUtil.map(equipmentCosts, this::toEquipmentCost),
					StreamUtil.map(fiberCosts, this::toFiberCost));
		}

		public PlanAnalysisReport toAnalysisReport(
				NetworkReportSummary reportSummary) {

			if (reportSummary == null) {
				planAnalysisReportService.createPlanAnalysisReport();
			}

			return PlanAnalysisReportImpl.create(
					toPriceModel(reportSummary.getEquipmentCosts(),
							reportSummary.getFiberCosts()),
					toNetworkDemandSummary(reportSummary.getPlanDemands()),
					toNetworkStatistics(reportSummary.getLineItems()));

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
					ctx.getTypeId(cost.getNodeType()), reportSummary);

			es.setAtomicCount(cost.getAtomicUnits());
			es.setPrice(cost.getPrice());
			es.setQuantity(cost.getQuantity());
			es.setTotalCost(cost.getTotal());

			return es;
		}

		private FiberSummaryCost createFiberSummaryCost(FiberCost fiberCost) {

			FiberSummaryCost fc = new FiberSummaryCost(ctx.getTypeId(fiberCost
					.getFiberType()), reportSummary);

			fc.setCostPerMeter(fiberCost.getCostPerMeter());
			fc.setLengthMeters(fiberCost.getLengthMeters());
			fc.setTotalCost(fc.getTotalCost());

			return fc;
		}

		private Set<PlanDemand> createPlanDemand(
				NetworkDemandSummary demandSummary) {

			return new PlanDemandAssembler(demandSummary)
					.assemblePlanDemand(reportSummary);

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

		public ReportBuilder addDemand(NetworkDemandSummary demandSummary) {
			reportSummary.setPlanDemands(createPlanDemand(demandSummary));
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

	private class PlanDemandAssembler {

		private NetworkDemandSummary demandSummary;

		public PlanDemandAssembler(NetworkDemandSummary demandSummary) {
			super();
			this.demandSummary = demandSummary;
		}

		private PlanEntityDemand createPlanEntityDemand(PlanDemand planDemand,
				LocationEntityType type, DemandStatistic stat) {

			PlanEntityDemand ped = new PlanEntityDemand();

			ped.setPlanDemand(planDemand);
			ped.setEntityType(type.getTypeCode());

			ped.setFiberCount(stat.getAtomicUnits());
			ped.setPremises(stat.getRawCoverage());
			ped.setRevenueTotal(stat.getTotalRevenue());
			ped.setRevenueShare(stat.getMonthlyRevenueImpact());
			ped.setPenetration(stat.getPenetration());

			ped.setSharePremises(stat.getFairShareDemand());

			return ped;
		}

		private Set<PlanEntityDemand> createPlannedEntityDemands(
				PlanDemand prodDemand, LocationDemand demand) {
			Set<PlanEntityDemand> entityDemands = new HashSet<>();

			for (LocationEntityType t : LocationEntityType.values()) {
				entityDemands.add(createPlanEntityDemand(prodDemand, t,
						demand.getLocationDemand(t)));
			}

			return entityDemands;
		}

		private PlanDemand createPlanDemand(NetworkReportSummary reportSummary,
				DemandTypeEnum demandType, SpeedCategory speedType,
				int productType, LocationDemand demand) {

			PlanDemand pd = new PlanDemand();

			pd.setNetworkReportSummary(reportSummary);

			pd.setProductType(productType);
			pd.setSpeedType(speedType);
			pd.setDemandType(demandType);

			pd.setPlanEntityDemands(createPlannedEntityDemands(pd, demand));

			return pd;
		}

		public Set<PlanDemand> assemblePlanDemand(
				NetworkReportSummary networkReportSummary) {

			Set<PlanDemand> demands = new HashSet<>();

			for (NetworkDemand d : demandSummary.getNetworkDemands()) {
				demands.add(createPlanDemand(networkReportSummary,
						d.getDemandType(), d.getSpeedCategory(), 1,
						d.getLocationDemand()));

			}

			return demands;

		}

	}

	private static class SummarizedPlanImpl implements SummarizedPlan {

		private long planId;
		private PlanAnalysisReport planAnalysisReport;

		public SummarizedPlanImpl(long planId,
				PlanAnalysisReport planAnalysisReport) {
			super();
			this.planId = planId;
			this.planAnalysisReport = planAnalysisReport;
		}

		@Override
		public long getPlanId() {
			return planId;
		}

		@Override
		public PlanAnalysisReport getPlanAnalysisReport() {
			return planAnalysisReport;
		}

	}

}
