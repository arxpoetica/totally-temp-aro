package com.altvil.aro.service.roic.analysis.builder.network.impl;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentBuilderService;
import com.altvil.aro.service.roic.analysis.builder.impl.AbstractEnumAggregator;
import com.altvil.aro.service.roic.analysis.builder.impl.DefaultDerivedModel;
import com.altvil.aro.service.roic.analysis.builder.network.NetworkBuilder;
import com.altvil.aro.service.roic.analysis.builder.network.NetworkBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.builder.spi.DerivedModel;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.impl.RoicNetworkModelImpl;

@Service
public class NetworkModelBuilderServiceImpl implements NetworkBuilderService {

	private ComponentBuilderService componentBuilderService;
	
	@Autowired
	public NetworkModelBuilderServiceImpl(
			ComponentBuilderService componentBuilderServices) {
		super();
		this.componentBuilderService = componentBuilderServices;
	}

	@Override
	public NetworkBuilder build(NetworkAnalysisType networkAnalysisType) {
		return new NetworkBuilderImpl()
				.setNetworkAnalysisType(networkAnalysisType);
	}

	public Aggregator<ComponentType, RoicNetworkModel> aggregate() {
		return new NetworkAggregator();
	}

	@Override
	public Aggregator<ComponentType, RoicNetworkModel> aggregate(
			NetworkAnalysisType type) {
		return new NetworkAggregator() {
			@Override
			protected NetworkAnalysisType inferNetworkAnalysisType(
					Collection<RoicNetworkModel> models) {
				return type;
			}
		};
	}

	private class NetworkBuilderImpl implements NetworkBuilder {

		private AnalysisPeriod analysisPeriod;
		private NetworkAnalysisType networkAnalysisType;
		private RoicInputs roicInputs;

		@Override
		public NetworkBuilder setNetworkAnalysisType(NetworkAnalysisType type) {
			this.networkAnalysisType = type;
			return this;
		}

		@Override
		public NetworkBuilder setAnalysisPeriod(AnalysisPeriod period) {
			this.analysisPeriod = period;
			return this;
		}

		@Override
		public NetworkBuilder set(RoicInputs roicInputs) {
			this.roicInputs = roicInputs;
			return this;
		}

		@Override
		public RoicNetworkModel build() {
			return componentBuilderService.createNetworkModel(
					networkAnalysisType, analysisPeriod, roicInputs);
		}

	}

	private class NetworkAggregator
			extends
			AbstractEnumAggregator<ComponentType, RoicComponent, RoicNetworkModel> {

		protected NetworkAnalysisType networkAnalysisType = NetworkAnalysisType.undefined;

		public NetworkAggregator() {
			super(ComponentType.class);
		}

		@Override
		protected RoicComponent reduce(ComponentType key,
				Collection<RoicComponent> components) {
			return componentBuilderService.aggregate(networkAnalysisType)
					.addAll(components).sum();
		}

		protected NetworkAnalysisType inferNetworkAnalysisType(
				Collection<RoicNetworkModel> models) {
			return models.iterator().next().getNetworkAnalysisType();
		}

		@Override
		protected DerivedModel<ComponentType, RoicComponent> transform(
				Collection<RoicNetworkModel> models) {
			networkAnalysisType = inferNetworkAnalysisType(models);
			return createDerivedModel(models);
		}

		@Override
		protected RoicNetworkModel toRoicModel(AnalysisPeriod period,
				Map<ComponentType, RoicComponent> componentMap) {
			return new RoicNetworkModelImpl(networkAnalysisType, period,
					componentMap);
		}
	}

	private static DerivedModel<ComponentType, RoicComponent> createDerivedModel(
			Collection<RoicNetworkModel> models) {

		return new DefaultDerivedModel<>(
				models.stream()
						.flatMap(m -> m.getRoicComponents().stream())
						.collect(
								Collectors
										.groupingBy(RoicComponent::getComponentType)));
	}

}
