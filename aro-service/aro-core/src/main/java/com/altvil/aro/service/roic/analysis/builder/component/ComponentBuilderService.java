package com.altvil.aro.service.roic.analysis.builder.component;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface ComponentBuilderService {

	public RoicNetworkModel createNetworkModel(NetworkAnalysisType type,
			AnalysisPeriod period, RoicInputs inputs);

	public RoicComponentAggregator aggregate(NetworkAnalysisType type);

}