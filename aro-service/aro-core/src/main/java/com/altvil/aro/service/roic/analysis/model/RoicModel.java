package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.RowReference;

public interface RoicModel extends RoicAnalysis {

	AnalysisPeriod getAnalysisPeriod();

	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

	Collection<RoicNetworkModel> getRoicNetworkModels() ;
	
	Collection<String> getCurvePaths();

	AnalysisRow getAnalysisRow(String row);
	
	RowReference getRowReference(String row);
	
	
}
