package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.builder.network.impl.NetworkAnalysisBuilder;

public interface AnalysisService {

	NetworkAnalysisBuilder createNetworkAnalysisBuilder();

}
