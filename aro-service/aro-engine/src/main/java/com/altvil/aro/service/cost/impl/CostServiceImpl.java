package com.altvil.aro.service.cost.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Function;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.LineItem;
import com.altvil.aro.model.LineItemKey;
import com.altvil.aro.model.LineItemType;
import com.altvil.aro.model.NetworkReport;
import com.altvil.aro.model.ReportType;
import com.altvil.aro.persistence.repository.EquipmentSummaryCostRepository;
import com.altvil.aro.persistence.repository.FiberSummaryCostRepository;
import com.altvil.aro.persistence.repository.LineItemRepository;
import com.altvil.aro.persistence.repository.LineItemTypeRepository;
import com.altvil.aro.persistence.repository.NetworkReportRepository;
import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.utils.StreamUtil;

@Service
public class CostServiceImpl implements CostService {

	private static final Logger log = LoggerFactory
			.getLogger(CostServiceImpl.class.getName());

	private NetworkReportRepository networkReportRepository;
	private EquipmentSummaryCostRepository equipmentSummaryCostRepository;
	private FiberSummaryCostRepository fiberSummaryCostRepository;
	private LineItemRepository lineItemRepository;
	private LineItemTypeRepository lineItemTypeRepository;

	private ReportGenerator reportGenerator;

	@Autowired
	public CostServiceImpl(NetworkReportRepository networkReportRepository,
			EquipmentSummaryCostRepository equipmentSummaryCostRepository,
			FiberSummaryCostRepository fiberSummaryCostRepository,
			LineItemRepository lineItemRepository,
			LineItemTypeRepository lineItemTypeRepository) {
		super();
		this.networkReportRepository = networkReportRepository;
		this.equipmentSummaryCostRepository = equipmentSummaryCostRepository;
		this.fiberSummaryCostRepository = fiberSummaryCostRepository;
		this.lineItemRepository = lineItemRepository;
		this.lineItemTypeRepository = lineItemTypeRepository;
	}

	@PostConstruct
	void PostConstruct() {
		this.reportGenerator =new ReportGenerator(createLineItemMapping()) ;
	}

	private Map<LineItemTypeEnum, LineItemType> createLineItemMapping() {

		Map<String, LineItemType> nameMap = StreamUtil.hash(
				lineItemTypeRepository.findAll(), LineItemType::getName);
		Map<LineItemTypeEnum, LineItemType> result = new EnumMap<>(
				LineItemTypeEnum.class);
		for (LineItemTypeEnum t : LineItemTypeEnum.values()) {
			LineItemType lit = nameMap.get(t.getCode());
			if (lit == null) {
				log.warn("Failed to match enum " + t);
			} else {
				result.put(t, lit);
			}
		}

		return result;

	}

	@Override
	public Double getTotalPlanCost(long planId) {
		return networkReportRepository.getTotalPlanCost(planId);
	}

	@Override
	public void updateWireCenterCosts(WirecenterNetworkPlan plan) {

		long planId = plan.getPlanId();

		networkReportRepository.deleteReportsForPlan(planId);

		update(planId, ReportType.detail_equipment,
				(report) -> networkReportRepository
						.updateWireCenterEquipmentCost(report.getId()));

		update(planId, ReportType.summary_equipment,
				(report) -> networkReportRepository
						.updateWireCenterEquipmentSummary(report.getId()));

		update(planId, ReportType.summary_fiber,
				(report) -> networkReportRepository
						.updateWireCenterFiberSummary(report.getId()));

		updateWirecenterFinancials(plan);

	}

	private void updateWirecenterFinancials(WirecenterNetworkPlan plan) {
		NetworkReport report = createReport(plan.getPlanId(),
				ReportType.wirecenter_report);
		lineItemRepository.save(reportGenerator.generateReport(report, plan));
	}

	@Override
	public void updateMasterPlanCosts(long planId) {

		networkReportRepository.deleteReportsForPlan(planId);

		update(planId, ReportType.summary_equipment,
				(report) -> networkReportRepository
						.updateMasterPlanEquipmentSummary(report.getId()));

		update(planId, ReportType.summary_fiber,
				(report) -> networkReportRepository
						.updateMasterPlanFiberSummary(report.getId()));
	}

	private void update(long planId, ReportType rt,
			Consumer<NetworkReport> action) {
		NetworkReport report = createNetworkReport(planId, rt);
		networkReportRepository.save(report);
		action.accept(report);
	}

	@Transactional
	private NetworkReport createReport(long planId, ReportType rt) {
		NetworkReport report = createNetworkReport(planId, rt);
		networkReportRepository.save(report);
		return report;
	}

	@Override
	public List<FiberSummaryCost> getFiberReport(long planId) {
		NetworkReport report = networkReportRepository.findReport(planId,
				ReportType.summary_fiber);
		if (report == null) {
			return Collections.emptyList();
		}
		return fiberSummaryCostRepository.findEquipmentSummaryCosts(report
				.getId());
	}

	@Override
	public List<EquipmentSummaryCost> getEquipmentReport(long planId) {
		NetworkReport report = networkReportRepository.findReport(planId,
				ReportType.summary_equipment);

		if (report == null) {
			return Collections.emptyList();
		}

		return equipmentSummaryCostRepository.findEquipmentSummaryCost(report
				.getId());
	}

	private NetworkReport createNetworkReport(long planId, ReportType type) {
		NetworkReport report = new NetworkReport();
		report.setPlanId(planId);
		report.setDate(new Date());
		report.setReportType(type);
		return report;
	}

	private interface LineItemGenerator {
		LineItem generate(NetworkReport report, WirecenterNetworkPlan plan);
	}

	private static class LineItemGeneratorDefault implements LineItemGenerator {

		private LineItemType lineItemType;
		private Function<WirecenterNetworkPlan, Double> f;

		public LineItemGeneratorDefault(LineItemType lineItemType,
				Function<WirecenterNetworkPlan, Double> f) {
			super();
			this.lineItemType = lineItemType;
			this.f = f;
		}

		@Override
		public LineItem generate(NetworkReport report,
				WirecenterNetworkPlan plan) {
			LineItem lineItem = new LineItem();

			Double val = Double.NaN;
			try {
				val = f.apply(plan);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
			}

			lineItem.setDoubleValue(val);
			lineItem.setId(new LineItemKey(lineItemType.getId(), report.getId()));

			return lineItem;
		}

	}

	private enum LineItemTypeEnum {
		cost("cost"), irr("irr"), npv("npv"), revenue("revenue"), household_count(
				"household.count"), household_fairshare("household.fairshare"), celltower_count(
				"celltower.count"), celltower_fairshare("celltower.fairshare"), small_business_count(
				"small_business.count"), small_business_fairshare(
				"small_business.fairshare"), medium_business_count(
				"medium_business.count"), medium_business_fairshare(
				"medium_business.fairshare"), large_business_count(
				"large_business.count"), large_fairshare("large.fairshare"),

		;

		private String code;

		private LineItemTypeEnum(String code) {
			this.code = code;
		}

		public String getCode() {
			return code;
		}

	}

	private class ReportGenerator {

		private Map<LineItemTypeEnum, LineItemType> mapping;
		private Collection<LineItemGenerator> lineItemGenerators = new ArrayList<>();

		public ReportGenerator(Map<LineItemTypeEnum, LineItemType> mapping) {
			super();
			this.mapping = mapping;
			init();
		}

		private void add(LineItemGenerator lineItemGenerator) {
			lineItemGenerators.add(lineItemGenerator);
		}

		private void add(LineItemTypeEnum type,
				Function<WirecenterNetworkPlan, Double> f) {
			add(new LineItemGeneratorDefault(mapping.get(type), f));
		}

		private void init() {
			add(LineItemTypeEnum.revenue, (ws) -> 0.0);
			add(LineItemTypeEnum.irr, (ws) -> 0.0);
			add(LineItemTypeEnum.npv, (ws) -> 0.0);

			add(LineItemTypeEnum.household_count, (ws) -> 0.0);
			add(LineItemTypeEnum.household_fairshare, (ws) -> 0.0);

			add(LineItemTypeEnum.small_business_count, (ws) -> 0.0);
			add(LineItemTypeEnum.small_business_fairshare, (ws) -> 0.0);

			add(LineItemTypeEnum.medium_business_count, (ws) -> 0.0);
			add(LineItemTypeEnum.medium_business_fairshare, (ws) -> 0.0);

			add(LineItemTypeEnum.large_business_count, (ws) -> 0.0);
			add(LineItemTypeEnum.large_fairshare, (ws) -> 0.0);

		}

		public Collection<LineItem> generateReport(NetworkReport report,
				WirecenterNetworkPlan plan) {
			return StreamUtil.map(lineItemGenerators,
					g -> g.generate(report, plan));
		}

	}

}
