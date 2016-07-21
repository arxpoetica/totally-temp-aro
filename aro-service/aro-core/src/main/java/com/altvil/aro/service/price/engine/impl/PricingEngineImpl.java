package com.altvil.aro.service.price.engine.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.engine.EquipmentCost;
import com.altvil.aro.service.price.engine.EquipmentCost.EquipmentAggregator;
import com.altvil.aro.service.price.engine.FiberCost;
import com.altvil.aro.service.price.engine.FiberCost.FiberCostAggregator;
import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.aro.service.price.engine.PricingEngine;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.Aggregator;
import com.altvil.utils.reflexive.DefaultMappedCodes;
import com.altvil.utils.reflexive.MappedCodes;

@Service
public class PricingEngineImpl implements PricingEngine {

	private MappedCodes<NetworkNodeType, MaterialType> equipmentCodeMapping = DefaultMappedCodes
			.build(NetworkNodeType.class, MaterialType.class)
			.add(NetworkNodeType.central_office, MaterialType.CO)
			.add(NetworkNodeType.fiber_distribution_hub, MaterialType.FDH)
			.add(NetworkNodeType.fiber_distribution_terminal, MaterialType.FDT)
			.add(NetworkNodeType.bulk_distrubution_terminal, MaterialType.BFT)
			.build();

	@Override
	public PriceModelBuilder createPriceModelBuilder(PricingModel pricingModel) {
		return new PriceModelBuilderImpl(pricingModel, equipmentCodeMapping);
	}

	public Aggregator<PriceModel> createAggregator(PricingModel pricingModel) {
		PriceModelBuilder builder = createPriceModelBuilder(pricingModel);
		return new Aggregator<PriceModel>() {
			@Override
			public void add(PriceModel val) {
				val.getEquipmentCosts().forEach(builder::add);
				val.getFiberCosts().forEach(builder::add);
			}

			@Override
			public PriceModel apply() {
				return builder.build();
			}
		};

	}

	public PriceModel createPriceModel(
			Collection<EquipmentCost> equipmentCosts,
			Collection<FiberCost> fiberCosts) {

		return new PriceModelIml(equipmentCosts.stream()
				.mapToDouble(EquipmentCost::getTotal).sum()
				+ fiberCosts.stream().mapToDouble(FiberCost::getTotalCost)
						.sum(), equipmentCosts, fiberCosts);
	}

	private class PriceModelBuilderImpl implements PriceModelBuilder {

		private PricingModel pricingModel;
		private MappedCodes<NetworkNodeType, MaterialType> typeMapping;

		private Map<FiberType, FiberCostAggregator> fiberCostMap = new EnumMap<>(
				FiberType.class);
		private Map<NetworkNodeType, EquipmentAggregator> equipmentMap = new EnumMap<>(
				NetworkNodeType.class);

		private Map<FiberType, Double> fiberCostPerMeterMap = new EnumMap<>(
				FiberType.class);

		public PriceModelBuilderImpl(PricingModel pricingModel,
				MappedCodes<NetworkNodeType, MaterialType> typeMapping) {
			super();
			this.pricingModel = pricingModel;
			this.typeMapping = typeMapping;

			init();
		}

		private void init() {
			for (NetworkNodeType nt : equipmentCodeMapping.getSourceCodes()) {
				equipmentMap.put(nt,
						EquipmentCost.aggregator(nt, pricingModel
								.getMaterialCost(typeMapping.getDomain(nt))));
			}

			for (FiberType ft : FiberType.values()) {

				fiberCostPerMeterMap.put(ft,
						pricingModel.getFiberCostPerMeter(ft, 1));

				fiberCostMap.put(
						ft,
						FiberCost.aggregate(ft,
								pricingModel.getFiberCostPerMeter(ft, 1)));
			}
		}

		@Override
		public PriceModelBuilder add(EquipmentCost equipmentCost) {
			equipmentMap.get(equipmentCost.getNodeType()).add(equipmentCost);
			return this;
		}

		@Override
		public PriceModelBuilder add(FiberCost fiberCost) {
			fiberCostMap.get(fiberCost.getFiberType()).add(fiberCost);
			return this;
		}

		@Override
		public PriceModelBuilder add(MaterialType type, double quantity,
				double atomicUnits) {
			equipmentMap.get(type).add(atomicUnits, quantity,
					pricingModel.getMaterialCost(type, atomicUnits) * quantity);
			return this;
		}

		@Override
		public PriceModelBuilder add(NetworkNodeType type, double quantity,
				double atomicUnits) {
			equipmentMap.get(type).add(
					atomicUnits,
					quantity,
					pricingModel.getMaterialCost(typeMapping.getDomain(type),
							atomicUnits) * quantity);
			return this;
		}

		@Override
		public PriceModelBuilder add(FiberType type, double lengthInMeteres) {
			fiberCostMap.get(type).add(lengthInMeteres,
					fiberCostPerMeterMap.get(type) * lengthInMeteres);
			return this;
		}

		@Override
		public PriceModel build() {

			Collection<EquipmentCost> equipmentCosts = StreamUtil.map(
					equipmentMap.values(), EquipmentAggregator::apply);
			Collection<FiberCost> fiberCosts = StreamUtil.map(
					fiberCostMap.values(), FiberCostAggregator::apply);

			double totalCost = equipmentCosts.stream()
					.mapToDouble(EquipmentCost::getTotal).sum()
					+ fiberCosts.stream().mapToDouble(FiberCost::getTotalCost)
							.sum();

			return new PriceModelIml(totalCost, equipmentCosts, fiberCosts);
		}

	}

	private static class PriceModelIml implements PriceModel {

		private double totalCost;
		private Collection<EquipmentCost> equipmentCosts;
		private Collection<FiberCost> fiberCosts;

		public PriceModelIml(double totalCost,
				Collection<EquipmentCost> equipmentCosts,
				Collection<FiberCost> fiberCosts) {
			super();
			this.totalCost = totalCost;
			this.equipmentCosts = equipmentCosts;
			this.fiberCosts = fiberCosts;
		}

		@Override
		public double getTotalCost() {
			return totalCost;
		}

		@Override
		public Collection<EquipmentCost> getEquipmentCosts() {
			return equipmentCosts;
		}

		@Override
		public Collection<FiberCost> getFiberCosts() {
			return fiberCosts;
		}

	}

}
