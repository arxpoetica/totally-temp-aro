package com.altvil.netop.report;

import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.price.engine.EquipmentCost;
import com.altvil.aro.service.price.engine.FiberCost;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.utils.StreamUtil;

@RestController
public class CostEndPoint {

	@Autowired
	private NetworkReportService reportingService;

	public static class AroPlanAnalysisReport {

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

	private AroPriceModel toAroPriceModel(PriceModel priceModel) {
		return new AroPriceModel(priceModel.getTotalCost(),
				toEquipmentCosts(priceModel.getEquipmentCosts()),
				toFiberCosts(priceModel.getFiberCosts()));
	}

	private Collection<AroEquipmentCost> toEquipmentCosts(
			Collection<EquipmentCost> costs) {

		return StreamUtil
				.map(costs,
						c -> new AroEquipmentCost(c.getNodeType().name(),
								reportingService.getCostCode(c.getNodeType())
										.getName(), c.getPrice(), c
										.getQuantity(), c.getTotal(), c
										.getAtomicUnits()));
	}

	private Collection<AroFiberCost> toFiberCosts(
			Collection<FiberCost> fiberCosts) {
		return StreamUtil.map(
				fiberCosts,
				c -> new AroFiberCost(c.getFiberType().getCode(),
						reportingService.getCostCode(c.getFiberType())
								.getName(), c.getCostPerMeter(), c
								.getLengthMeters(), c.getTotalCost()));

	}

	public static class AroPriceModel {

		private double totalCost;
		private Collection<AroEquipmentCost> equipmentCosts;
		private Collection<AroFiberCost> fiberCosts;

		public AroPriceModel(double totalCost,
				Collection<AroEquipmentCost> equipmentCosts,
				Collection<AroFiberCost> fiberCosts) {
			super();
			this.totalCost = totalCost;
			this.equipmentCosts = equipmentCosts;
			this.fiberCosts = fiberCosts;
		}

		public double getTotalCost() {
			return totalCost;
		}

		public Collection<AroEquipmentCost> getEquipmentCosts() {
			return equipmentCosts;
		}

		public Collection<AroFiberCost> getFiberCosts() {
			return fiberCosts;
		}

	}

	public static class AroEquipmentCost {
		private String nodeType;
		private String costCode;
		private double price;

		private double quantity;
		private double total;
		private double atomicUnits;

		public AroEquipmentCost(String nodeType, String costCode, double price,
				double quantity, double total, double atomicUnits) {
			super();
			this.nodeType = nodeType;
			this.costCode = costCode;
			this.price = price;
			this.quantity = quantity;
			this.total = total;
			this.atomicUnits = atomicUnits;
		}

		public String getNodeType() {
			return nodeType;
		}

		public String getCostCode() {
			return costCode;
		}

		public double getPrice() {
			return price;
		}

		public double getQuantity() {
			return quantity;
		}

		public double getTotal() {
			return total;
		}

		public double getAtomicUnits() {
			return atomicUnits;
		}

	}

	public static class AroFiberCost {

		private String fiberType;
		private String costCode;
		double costPerMeter;

		private double lengthMeters;
		private double totalCost;

		public AroFiberCost(String fiberType, String costCode,
				double costPerMeter, double lengthMeters, double totalCost) {
			super();
			this.fiberType = fiberType;
			this.costCode = costCode;
			this.costPerMeter = costPerMeter;
			this.lengthMeters = lengthMeters;
			this.totalCost = totalCost;
		}

		public String getFiberType() {
			return fiberType;
		}

		public String getCostCode() {
			return costCode;
		}

		public double getCostPerMeter() {
			return costPerMeter;
		}

		public double getLengthMeters() {
			return lengthMeters;
		}

		public double getTotalCost() {
			return totalCost;
		}

	}

	@Autowired
	private NetworkReportService costService;

	@RequestMapping(value = "/report/plan/{id}", method = RequestMethod.GET)
	public @ResponseBody AroPlanAnalysisReport getReportSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		PlanAnalysisReport report = costService.loadSummarizedPlan(planId)
				.getPlanAnalysisReport();
		return new AroPlanAnalysisReport(
				toAroPriceModel(report.getPriceModel()),
				report.getDemandSummary(), report.getNetworkStatistics());
	}

	@RequestMapping(value = "/report/plan/{id}/equipment_summary", method = RequestMethod.GET)
	public @ResponseBody List<EquipmentSummaryCost> getEquipmentSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getEquipmentReport(planId);
	}

	@RequestMapping(value = "/report/plan/{id}/fiber_summary", method = RequestMethod.GET)
	public @ResponseBody List<FiberSummaryCost> getFiberSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getFiberReport(planId);
	}

}
