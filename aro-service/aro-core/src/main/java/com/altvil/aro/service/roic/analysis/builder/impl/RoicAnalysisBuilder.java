package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.Before;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.RoicInputs;
import com.altvil.aro.service.roic.analysis.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.impl.AnalysisServiceImpl;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.impl.RoicModelImpl;
import com.altvil.utils.StreamUtil;

public class RoicAnalysisBuilder implements RoicModelBuilder {

	private AnalysisPeriod analysisPeriod;
	private Map<NetworkAnalysisType, RoicInputs> roicInputsMap = new EnumMap<>(
			NetworkAnalysisType.class);

	private AnalysisService analysisService;
	
	@Override
	public RoicModelBuilder setAnalysisPeriod(AnalysisPeriod period) {
		this.analysisPeriod = period;
		return this;
	}

	public RoicAnalysisBuilder(AnalysisService analysisService) {
		super();
		this.analysisService = analysisService;
	}

	@Override
	public RoicModelBuilder addRoicInputs(RoicInputs roicInputs) {
		roicInputsMap.put(roicInputs.getType(), roicInputs);
		return this;
	}

	private ComponentInput modifyIntersectComponentInput(ComponentInput copper,
			ComponentInput fiber) {

		if (fiber == null) {
			return copper;
		}

		return copper
				.clone()
				.setNetworkPenetration(
						copper.getPenetration().zeroFairShare())
				.setEntityCount(fiber.getEntityCount()).assemble();
	}

	private ComponentInput modifyRemainingComponentInput(ComponentInput copper,
			ComponentInput fiber) {

		if (fiber == null) {
			return copper;
		}

		return copper
				.clone()
				.setEntityCount(
						copper.getEntityCount() - fiber.getEntityCount())
				.assemble();
	}

	private RoicInputs modifyCopper(RoicInputs copper, RoicInputs fiber,
			NetworkAnalysisType at) {

		RoicInputs modified = new RoicInputs();

		Map<ComponentType, ComponentInput> fiberComponents = StreamUtil.hash(
				fiber.getComponentInputs(), ci -> ci.getComponentType());

		modified.setFixedCost(copper.getFixedCost());
		modified.setType(at);

		Collection<ComponentInput> modfiedInputs = null;

		modfiedInputs = copper
				.getComponentInputs()
				.stream()
				.map(ci -> {
					ComponentInput fiberInput = fiberComponents.get(ci
							.getComponentType());
					return (at == NetworkAnalysisType.copper_intersects) ? modifyIntersectComponentInput(
							ci, fiberInput) : modifyRemainingComponentInput(ci,
							fiberInput);

				}).collect(Collectors.toList());

		modified.setComponentInputs(modfiedInputs);

		return modified;
	}

	@Override
	public RoicModel build() {

		ModelBuilder modelBuilder = new ModelBuilder();

		modelBuilder.addNetwork(roicInputsMap.get(NetworkAnalysisType.copper),
				NetworkAnalysisType.copper);

		modelBuilder.alias(NetworkAnalysisType.bau, modelBuilder.get(NetworkAnalysisType.copper));
		
		
		modelBuilder.addNetwork(roicInputsMap.get(NetworkAnalysisType.fiber),
				NetworkAnalysisType.fiber);

		modelBuilder.addNetwork(
				modifyCopper(roicInputsMap.get(NetworkAnalysisType.copper),
						roicInputsMap.get(NetworkAnalysisType.fiber),
						NetworkAnalysisType.copper_intersects),
				NetworkAnalysisType.copper_intersects);

		modelBuilder.addNetwork(
				modifyCopper(roicInputsMap.get(NetworkAnalysisType.copper),
						roicInputsMap.get(NetworkAnalysisType.fiber),
						NetworkAnalysisType.copper_remaining),
				NetworkAnalysisType.copper_remaining);

		modelBuilder
				.addModel(modelBuilder
						.get(NetworkAnalysisType.fiber)
						.add()
						.addModel(
								modelBuilder
										.get(NetworkAnalysisType.copper_intersects))
						.addModel(
								modelBuilder
										.get(NetworkAnalysisType.copper_remaining))
						.setType(NetworkAnalysisType.planned).apply());

		modelBuilder.addModel(modelBuilder.get(NetworkAnalysisType.planned)
				.difference()
				.setModel(modelBuilder.get(NetworkAnalysisType.copper))
				.setType(NetworkAnalysisType.incremental).apply());

		return modelBuilder.build();
	}

	private class ModelBuilder {

		Map<NetworkAnalysisType, RoicNetworkModel> result = new EnumMap<>(
				NetworkAnalysisType.class);

		public RoicNetworkModel get(NetworkAnalysisType type) {
			return result.get(type);
		}

		public RoicModel build() {
			return new RoicModelImpl(analysisPeriod, result);
		}

		public void addModel(RoicNetworkModel model) {
			result.put(model.getNetworkAnalysisType(), model);
		}
		
		public void alias(NetworkAnalysisType type, RoicNetworkModel model) {
			result.put(type, model);
		}
		
		
		public RoicNetworkModel addNetwork(RoicInputs inputs,
				NetworkAnalysisType type) {

			NetworkAnalysisBuilder b = analysisService
					.createNetworkAnalysisBuilder()
					.setAnalysisPeriod(analysisPeriod)
					.setFixedCosts(inputs.getFixedCost())
					.setNetworkAnalysisType(type);

			inputs.getComponentInputs().forEach(
					ci -> {
						b.addRoicComponent(analysisService
								.createComponentBuilder(type.getNetworkType())
								.setAnalysisPeriod(analysisPeriod)
								.setComponentType(ci.getComponentType())
								.setRoicModelInputs(ci).build());
					});

			RoicNetworkModel model = b.build();
			addModel(model);
			return model;

		}
	}

}
