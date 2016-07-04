package com.altvil.aro.service.roic.analysis.builder.config;

import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicConfigService {

	RoicConfiguration getRoicConfiguration(
			NetworkAnalysisType analysisType);

}