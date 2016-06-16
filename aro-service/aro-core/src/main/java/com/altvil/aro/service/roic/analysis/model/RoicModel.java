package com.altvil.aro.service.roic.analysis.model;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;

public interface RoicModel extends CurveRegistry {

	AnalysisPeriod getAnalysisPeriod();

	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

}
