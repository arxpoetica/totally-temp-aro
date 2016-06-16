package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.Map;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.registry.DefaultContainerRegistry;

public class RoicModelImpl extends DefaultContainerRegistry implements
		RoicModel {

	private AnalysisPeriod analysisPeriod;
	private Map<NetworkAnalysisType, RoicNetworkModel> map;

	public RoicModelImpl(AnalysisPeriod analysisPeriod,
			Map<NetworkAnalysisType, RoicNetworkModel> map) {
		super("roic");
		this.analysisPeriod = analysisPeriod;
		this.map = map;

		add(map.values());
	}

	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	@Override
	public RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type) {
		return map.get(type);
	}

}
