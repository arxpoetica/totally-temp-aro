package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.model.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.model.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.model.builder.impl.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.model.NetworkType;

public interface AnalysisService {

	ComponentBuilder createComponentBuilder(NetworkType type);

	NetworkAnalysisBuilder createNetworkAnalysisBuilder();

	RoicModelBuilder createRoicModelBuilder();

}
