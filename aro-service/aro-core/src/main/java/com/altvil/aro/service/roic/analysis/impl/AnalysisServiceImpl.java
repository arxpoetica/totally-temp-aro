package com.altvil.aro.service.roic.analysis.impl;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.model.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.model.builder.ComponentBuilderImpl;
import com.altvil.aro.service.roic.analysis.model.builder.NetworkAnalysisBuilderImpl;
import com.altvil.aro.service.roic.analysis.model.builder.RoicAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.model.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.model.builder.impl.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.model.NetworkType;

@Service
public class AnalysisServiceImpl implements AnalysisService {

	@Override
	public ComponentBuilder createComponentBuilder(NetworkType type) {
		return new ComponentBuilderImpl(this, type);
	}

	@Override
	public NetworkAnalysisBuilder createNetworkAnalysisBuilder() {
		return new NetworkAnalysisBuilderImpl(this);
	}

	@Override
	public RoicModelBuilder createRoicModelBuilder() {
		return new RoicAnalysisBuilder(this);
	}

}
