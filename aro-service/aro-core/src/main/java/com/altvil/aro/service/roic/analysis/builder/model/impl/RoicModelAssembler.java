package com.altvil.aro.service.roic.analysis.builder.model.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.network.NetworkBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.op.curve.CurveOp;
import com.altvil.utils.StreamUtil;

public class RoicModelAssembler {

	public static RoicModelAssembler create(
			NetworkBuilderService networkBuilderService,
			AnalysisPeriod analysisPeriod, Collection<RoicInputs> roicInputs) {

		return new RoicModelAssembler(networkBuilderService, analysisPeriod,
				StreamUtil.hash(roicInputs, RoicInputs::getType));
	}

	private NetworkBuilderService networkBuilderService;
	private AnalysisPeriod analysisPeriod;
	private Map<NetworkAnalysisType, RoicInputs> roicInputsMap = new EnumMap<>(
			NetworkAnalysisType.class);

	private RoicModelAssembler(NetworkBuilderService networkBuilderService,
			AnalysisPeriod analysisPeriod,
			Map<NetworkAnalysisType, RoicInputs> roicInputsMap) {
		super();
		this.networkBuilderService = networkBuilderService;
		this.analysisPeriod = analysisPeriod;
		this.roicInputsMap = roicInputsMap;
	}

	private ComponentInput modifyIntersectComponentInput(ComponentInput copper,
			ComponentInput fiber) {

		if (fiber == null) {
			return copper;
		}

		return copper
				.clone()
				.setNetworkPenetration(
						copper.getPenetration().zeroFairShare()
								.modifyRate(fiber.getPenetration().getRate()))
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

	public Map<NetworkAnalysisType, RoicNetworkModel> assemble() {

		ModelBuilder modelBuilder = new ModelBuilder();

		modelBuilder.addNetwork(roicInputsMap.get(NetworkAnalysisType.copper),
				NetworkAnalysisType.copper);

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

		modelBuilder.addModel(networkBuilderService
				.aggregate(NetworkAnalysisType.planned)
				.add(modelBuilder.get(NetworkAnalysisType.fiber))
				.add(modelBuilder.get(NetworkAnalysisType.copper_intersects))
				.add(modelBuilder.get(NetworkAnalysisType.copper_remaining))
				.sum());

		modelBuilder.addModel(CurveOp.minus(
				modelBuilder.get(NetworkAnalysisType.planned),
				modelBuilder.get(NetworkAnalysisType.copper)));

		// modelBuilder.addModel(modelBuilder.get(NetworkAnalysisType.planned)
		// .minus(modelBuilder.get(NetworkAnalysisType.copper)));

		return modelBuilder.build();
	}

	private class ModelBuilder {

		Map<NetworkAnalysisType, RoicNetworkModel> result = new EnumMap<>(
				NetworkAnalysisType.class);

		public RoicNetworkModel get(NetworkAnalysisType type) {
			return result.get(type);
		}

		public Map<NetworkAnalysisType, RoicNetworkModel> build() {
			return result;
		}

		public void addModel(RoicNetworkModel model) {
			result.put(model.getNetworkAnalysisType(), model);
		}

		public RoicNetworkModel addNetwork(RoicInputs inputs,
				NetworkAnalysisType type) {

			RoicNetworkModel model = networkBuilderService.build(type)
					.setAnalysisPeriod(analysisPeriod).set(inputs).build();

			addModel(model);
			return model;
			//
			// NetworkAnalysisBuilder b = analysisService
			// .createNetworkAnalysisBuilder()
			// .setAnalysisPeriod(analysisPeriod)
			// .setFixedCosts(inputs.getFixedCost())
			// .setNetworkAnalysisType(type);
			//
			// inputs.getComponentInputs().forEach(
			// ci -> {
			// b.addRoicComponent(analysisService
			// .createComponentBuilder(type)
			// .setAnalysisPeriod(analysisPeriod)
			// .setComponentType(ci.getComponentType())
			// .setRoicModelInputs(ci).build());
			// });
			//
			// RoicNetworkModel model = b.build();
			// addModel(model);
			// return model;

		}
	}

}
