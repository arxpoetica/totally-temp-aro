package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.Map;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public class RoicModelImpl implements RoicModel {

	private AnalysisPeriod analysisPeriod;
	private Map<NetworkAnalysisType, RoicNetworkModel> map;

	public RoicModelImpl(AnalysisPeriod analysisPeriod,
			Map<NetworkAnalysisType, RoicNetworkModel> map) {
		super();
		this.analysisPeriod = analysisPeriod;
		this.map = map;
	}

	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	@Override
	public RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type) {
		return map.get(type);
	}

}
