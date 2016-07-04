package com.altvil.aro.service.roic.analysis.builder.network;

import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface NetworkBuilderService {

	NetworkBuilder build(NetworkAnalysisType networkAnalysisType);

	Aggregator<ComponentType, RoicNetworkModel> aggregate();

	Aggregator<ComponentType, RoicNetworkModel> aggregate(
			NetworkAnalysisType type);

}