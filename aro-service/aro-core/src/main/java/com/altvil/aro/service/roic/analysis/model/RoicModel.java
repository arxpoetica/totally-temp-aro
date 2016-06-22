package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicModel extends RoicAnalysis {

	AnalysisPeriod getAnalysisPeriod();

	RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type);

	Collection<String> getCurvePaths();

	AnalysisRow getAnalysisRow(String row);
	

	RowReference getRowReference(String row);
	
	
}
