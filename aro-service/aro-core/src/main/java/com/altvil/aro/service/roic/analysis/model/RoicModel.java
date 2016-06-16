package com.altvil.aro.service.roic.analysis.model;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicModel {

	AnalysisPeriod getAnalysisPeriod() ;
	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

}
