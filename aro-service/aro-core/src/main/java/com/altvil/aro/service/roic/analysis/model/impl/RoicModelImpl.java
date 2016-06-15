package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.Map;

import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public class RoicModelImpl implements RoicModel {

	private Map<NetworkAnalysisType, RoicNetworkModel> map;
	
	public RoicModelImpl(Map<NetworkAnalysisType, RoicNetworkModel> map) {
		super();
		this.map = map;
	}
	

	@Override
	public RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type) {
		return map.get(type);
	}

}
