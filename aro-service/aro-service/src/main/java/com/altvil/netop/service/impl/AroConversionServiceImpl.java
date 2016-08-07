package com.altvil.netop.service.impl;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.price.engine.EquipmentCost;
import com.altvil.aro.service.price.engine.FiberCost;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.netop.model.AroEquipmentCost;
import com.altvil.netop.model.AroFiberCost;
import com.altvil.netop.model.AroPlanAnalysisReport;
import com.altvil.netop.model.AroPriceModel;
import com.altvil.netop.service.AroConversionService;
import com.altvil.utils.StreamUtil;

@Service
public class AroConversionServiceImpl implements AroConversionService {

	@Autowired
	private NetworkReportService reportingService;

	
	@Override
	public AroPlanAnalysisReport toAroPlanAnalysisReport(
			PlanAnalysisReport report) {
		return new AroPlanAnalysisReport(
				toAroPriceModel(report.getPriceModel()),
				report.getDemandSummary(), report.getNetworkStatistics());

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
	      return fiberCosts.stream()
	                .filter(fiberCost -> fiberCost.getLengthMeters() != 0)
	                .map(c -> new AroFiberCost(
	                		c.getFiberConstructionType(),
	                        c.getCostPerMeter(),
	                        c.getLengthMeters(),
	                        c.getTotalCost()))
	                .collect(Collectors.toList());
	}

	
}
