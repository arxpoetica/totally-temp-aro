package com.altvil.aro.service.roic.analysis.model;

import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicModel {

	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

}
