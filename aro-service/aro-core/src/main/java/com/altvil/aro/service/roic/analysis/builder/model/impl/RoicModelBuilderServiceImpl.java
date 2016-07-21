package com.altvil.aro.service.roic.analysis.builder.model.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.builder.impl.AbstractEnumAggregator;
import com.altvil.aro.service.roic.analysis.builder.impl.DefaultDerivedModel;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilder;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.NetworkBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.builder.spi.DerivedModel;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.impl.RoicModelImpl;

@Service
public class RoicModelBuilderServiceImpl implements RoicBuilderService {

	private NetworkBuilderService networkBuilderService;

	@Autowired
	public RoicModelBuilderServiceImpl(
			NetworkBuilderService networkBuilderService) {
		super();
		this.networkBuilderService = networkBuilderService;
	}

	@Override
	public RoicBuilder buildModel() {
		return new RoicModelBuilderImpl();
	}

	@Override
	public Aggregator<NetworkAnalysisType, RoicModel> aggregate() {

		 Aggregator<NetworkAnalysisType, RoicModel> aggregator = new AbstractEnumAggregator<NetworkAnalysisType, RoicNetworkModel, RoicModel>(NetworkAnalysisType.class) {

			@Override
			protected DerivedModel<NetworkAnalysisType, RoicNetworkModel> transform(
					Collection<RoicModel> models) {

				Map<NetworkAnalysisType, List<RoicNetworkModel>> map = models
						.stream()
						.flatMap(m -> m.getRoicNetworkModels().stream())
						.filter(m -> !m.getNetworkAnalysisType().isAlias())
						.collect(
								Collectors
										.groupingBy(RoicNetworkModel::getNetworkAnalysisType));

				return new DefaultDerivedModel<NetworkAnalysisType, RoicNetworkModel>(
						map);

			}

			@Override
			protected RoicModel toRoicModel(AnalysisPeriod period,
					Map<NetworkAnalysisType, RoicNetworkModel> componentMap) {
				return new RoicModelImpl(period, componentMap);
			}

			@Override
			protected RoicNetworkModel reduce(NetworkAnalysisType key,
					Collection<RoicNetworkModel> components) {

				return networkBuilderService.aggregate().addAll(components)
						.sum();
			}
		};
		
		
		return aggregator ;
	}

	private class RoicModelBuilderImpl implements RoicBuilder {

		private AnalysisPeriod period;
		private Collection<RoicInputs> roicInputs = new ArrayList<>();

		@Override
		public RoicBuilder setAnalysisPeriod(AnalysisPeriod period) {
			this.period = period;
			return this;
		}

		@Override
		public RoicBuilder addRoicInputs(RoicInputs inputs) {
			roicInputs.add(inputs);
			return this;
		}

		@Override
		public RoicModel build() {
			return new RoicModelImpl(period, RoicModelAssembler.create(
					networkBuilderService, period, roicInputs).assemble());
		}

	}

}
