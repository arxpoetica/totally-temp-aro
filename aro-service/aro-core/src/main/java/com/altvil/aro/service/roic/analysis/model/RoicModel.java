package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;

public interface RoicModel extends CurveRegistry {

	AnalysisPeriod getAnalysisPeriod();

	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

	Collection<String> getCurvePaths();

	AnalysisRow getAnalysisRow(String row);

}
