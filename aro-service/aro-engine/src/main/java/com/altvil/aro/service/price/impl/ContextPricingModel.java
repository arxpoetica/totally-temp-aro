package com.altvil.aro.service.price.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.price.CableConstructionRatio;
import com.altvil.aro.service.price.ConstructionRatios;
import com.altvil.aro.service.price.PricingContext;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.interfaces.CableConstructionEnum;

class ContextPricingModel implements PricingModel {

	public static final PricingModel create(PricingModel pricingModel,
			PricingContext pricingContext) {
		return new ContextPricingModel(pricingModel, createDefaultFiberPrices(
				pricingModel, pricingContext.getConstructionRatios()));
	}

	private PricingModel pricingModel;
	private Map<FiberType, Double> defaultFiberPriceMap;

	private ContextPricingModel(PricingModel pricingModel,
			Map<FiberType, Double> defaultFiberPriceMap) {
		super();
		this.pricingModel = pricingModel;
		this.defaultFiberPriceMap = defaultFiberPriceMap;
	}

	@Override
	public double getPrice(DropCable dropCable) {
		return pricingModel.getPrice(dropCable);
	}

	private static Map<FiberType, Double> createDefaultFiberPrices(
			PricingModel pricingModel, ConstructionRatios constructionRatios) {

		Map<FiberType, Double> map = new EnumMap<>(FiberType.class);
		for (FiberType ft : FiberType.values()) {
			map.put(ft,
					computeDefaultPrice(ft, pricingModel, constructionRatios));
		}

		return map;
	}

	private static double computeDefaultPrice(FiberType ft,
			PricingModel pricingModel, ConstructionRatios constructionRatios) {
		double total = 0;
		for (CableConstructionRatio cr : constructionRatios
				.getCableConstructionRatios()) {
			total += pricingModel.getFiberCostPerMeter(ft, cr.getType(), 1)
					* cr.getRatio();
		}
		return total;
	}

	@Override
	public double getMaterialCost(MaterialType type) {
		return pricingModel.getMaterialCost(type);
	}

	@Override
	public double getMaterialCost(MaterialType type, double atomicUnits) {
		return pricingModel.getMaterialCost(type);
	}

	@Override
	public double getFiberCostPerMeter(FiberType fiberType,
			CableConstructionEnum constructionType, int requiredFiberStrands) {

		if (constructionType == CableConstructionEnum.ESTIMATED) {
			return defaultFiberPriceMap.get(fiberType);
		}

		return pricingModel.getFiberCostPerMeter(fiberType, constructionType,
				requiredFiberStrands);
	}

}
